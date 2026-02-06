"""
Core prompt engineering services - implements all 5 notebook features
plus custom prompt execution.
"""
import io
import re
import time
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# System prompts derived from the notebook
SYSTEM_PROMPTS = {
    'feedback_analysis': (
        "You are an assistant that supports a healthcare provider in analyzing patient reviews.\n\n"
        "Your goal is to extract key information from the user data provided below, including the "
        "patient's name, the doctor mentioned in the review, the review rating, a brief description "
        "of the review, and whether the patient expressed satisfaction with their appointment. "
        "Go through the user's feedback step by step, and generate a structured output for further "
        "analysis by the healthcare provider in the below format:\n\n"
        "{\n"
        '    "patient_name": "<extract the patient\'s first and last name from the corpus>",\n'
        '    "consulting_doctor": "<extract the doctor\'s first and last name and credentials from the corpus>",\n'
        '    "review_rating": "<this has to be a number out of 5 points - if you cannot find a rating, output NULL>",\n'
        '    "review_description": "<summarize the review at most in 50 words>",\n'
        '    "satisfaction": "<this has to be a TRUE or FALSE value - arrive at this conclusion using your own judgment>",\n'
        '    "issue_tags": "<in the case of a negative review or dissatisfaction, add tags which specify the area of dissatisfaction>"\n'
        "}"
    ),

    'meeting_summarizer': (
        "Your task is to summarize and document meeting transcripts.\n\n"
        "Carefully read through the user input and provide an output with the below sections:\n\n"
        "1. Date of the Meeting\n"
        "2. A summary of the overall objective\n"
        "3. The list of participants and their roles in the organization\n"
        "4. Crisp discussion points\n"
        "5. Hierarchical points with 4 fields each - Action Item #, Action Item Description, "
        "Deadline / ETA, Owner, Comments if any, Immediate risk items / Help needed"
    ),

    'quiz_generator': (
        "You are an assistant to a Corporate Trainer. Your task is to generate multiple choice "
        "questions from a provided text.\n\n"
        "Follow these instructions strictly when you create the quiz:\n\n"
        "1. The questions must come only from the provided text\n"
        "2. A question must have only one correct answer\n"
        "3. Each question must have exactly 4 options (A, B, C, D)\n"
        "4. Clearly indicate the correct answer for each question\n"
        "5. Create the requested difficulty mix\n"
        "6. Format output as JSON array with fields: question, options (array), correct_answer, difficulty"
    ),

    'slide_script': (
        "You are a professional presentation consultant. Generate a concise and compelling "
        "slide script based on the user's requirements.\n\n"
        "For each slide provide:\n"
        "- Slide number\n"
        "- Title\n"
        "- Key bullet points (3-5)\n"
        "- Speaker notes (2-3 sentences for verbal delivery)\n\n"
        "Format output as JSON array with fields: slide_number, title, bullets (array), speaker_notes"
    ),

    'complaint_response': (
        "You are {agent_name}, a Customer Support Assistant for {company_name}.\n"
        "You will be provided with a user complaint.\n"
        "Your task is to generate a response to the user complaint. Please process the user's complaint, "
        "identify its sentiment, and respond appropriately, always maintaining a polite and helpful tone. "
        "If possible, provide relevant information or troubleshooting steps.\n\n"
        "If the sentiment is negative or critical, assure the user that their concern is taken seriously, "
        "and a representative will address it as soon as possible.\n"
        "If the sentiment is positive or neutral, acknowledge the issue and offer any immediate assistance "
        "or guidance available.\n\n"
        "Also output a JSON block at the end with: sentiment, urgency (low/medium/high), category"
    ),
}


def get_llm(model_name='gpt-4o-mini', temperature=0.0, max_tokens=1024):
    """Create and return an LLM instance based on model name."""
    try:
        if 'claude' in model_name.lower() or 'anthropic' in model_name.lower():
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(
                model=model_name,
                temperature=temperature,
                max_tokens=max_tokens,
                api_key=settings.ANTHROPIC_API_KEY,
            )
        else:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                model=model_name,
                temperature=temperature,
                max_tokens=max_tokens,
                api_key=settings.OPENAI_API_KEY,
            )
    except Exception as e:
        logger.warning(f"Failed to create LLM ({model_name}): {e}. Using mock response.")
        return None


def execute_prompt(system_prompt, user_prompt, model='gpt-4o-mini', temperature=0.0, max_tokens=1024):
    """Execute a prompt and return the result with metadata."""
    start_time = time.time()

    llm = get_llm(model, temperature, max_tokens)

    if llm is None:
        # Return a mock response when no API key is configured
        elapsed = int((time.time() - start_time) * 1000)
        return {
            'output': (
                f"[Demo Mode - No API key configured]\n\n"
                f"This is a simulated response for the given prompt. "
                f"Configure OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env file "
                f"to get real AI responses.\n\n"
                f"System prompt: {system_prompt[:100]}...\n"
                f"User input length: {len(user_prompt)} chars"
            ),
            'tokens_input': len(user_prompt.split()),
            'tokens_output': 50,
            'cost_estimate': 0.0,
            'latency_ms': elapsed,
            'model': model,
        }

    try:
        messages = []
        if system_prompt:
            messages.append(('system', system_prompt))
        messages.append(('human', user_prompt))

        response = llm.invoke(messages)
        elapsed = int((time.time() - start_time) * 1000)

        tokens_in = getattr(response, 'usage_metadata', {}).get('input_tokens', len(user_prompt.split()))
        tokens_out = getattr(response, 'usage_metadata', {}).get('output_tokens', len(response.content.split()))

        return {
            'output': response.content,
            'tokens_input': tokens_in,
            'tokens_output': tokens_out,
            'cost_estimate': _estimate_cost(model, tokens_in, tokens_out),
            'latency_ms': elapsed,
            'model': model,
        }
    except Exception as e:
        elapsed = int((time.time() - start_time) * 1000)
        logger.error(f"LLM execution failed: {e}")
        return {
            'output': '',
            'error': str(e),
            'tokens_input': 0,
            'tokens_output': 0,
            'cost_estimate': 0.0,
            'latency_ms': elapsed,
            'model': model,
        }


def _estimate_cost(model, tokens_in, tokens_out):
    """Rough cost estimation based on model pricing."""
    pricing = {
        'gpt-4o-mini': (0.00015, 0.0006),
        'gpt-4o': (0.005, 0.015),
        'gpt-4': (0.03, 0.06),
        'claude-3-5-sonnet-20241022': (0.003, 0.015),
        'claude-3-haiku-20240307': (0.00025, 0.00125),
    }
    rates = pricing.get(model, (0.001, 0.002))
    return round((tokens_in / 1000 * rates[0]) + (tokens_out / 1000 * rates[1]), 6)


# --- Feature implementations ---

def analyze_feedback(review_text, model='gpt-4o-mini', temperature=0.0):
    system_prompt = SYSTEM_PROMPTS['feedback_analysis']
    user_prompt = f"---\nHere is the data:\n{review_text}"
    return execute_prompt(system_prompt, user_prompt, model, temperature)


def summarize_meeting(transcript, model='gpt-4o-mini', temperature=0.0):
    system_prompt = SYSTEM_PROMPTS['meeting_summarizer']
    user_prompt = f"---\nBelow is the transcript:\n{transcript}"
    return execute_prompt(system_prompt, user_prompt, model, temperature)


def generate_quiz(content, num_questions=5, difficulty_mix='2 easy, 2 intermediate, 1 hard',
                  model='gpt-4o-mini', temperature=0.0):
    system_prompt = SYSTEM_PROMPTS['quiz_generator']
    user_prompt = (
        f"Generate {num_questions} questions with the following difficulty distribution: {difficulty_mix}\n"
        f"---\nBelow is the information on which you have to generate the Quiz:\n{content}"
    )
    return execute_prompt(system_prompt, user_prompt, model, temperature, max_tokens=2048)


def generate_slide_script(topic, num_slides=3, style='professional',
                          model='gpt-4o-mini', temperature=0.7):
    system_prompt = SYSTEM_PROMPTS['slide_script']
    user_prompt = (
        f"Generate a {style} slide script on the topic: {topic}\n"
        f"Create exactly {num_slides} slides.\n"
        f"Please ensure that each slide contains enough information to provide a clear overview."
    )
    return execute_prompt(system_prompt, user_prompt, model, temperature)


def generate_complaint_response(complaint, company_name='Our Company', agent_name='Support Agent',
                                 model='gpt-4o-mini', temperature=0.3):
    system_prompt = SYSTEM_PROMPTS['complaint_response'].format(
        agent_name=agent_name, company_name=company_name
    )
    user_prompt = f"User complaint:\n{complaint}"
    return execute_prompt(system_prompt, user_prompt, model, temperature)


def execute_custom_prompt(system_prompt='', user_prompt='', model='gpt-4o-mini',
                          temperature=0.7, max_tokens=1024):
    return execute_prompt(system_prompt, user_prompt, model, temperature, max_tokens)


def _sanitize_json(text):
    """Clean LLM output to extract valid JSON."""
    cleaned = re.sub(r'```(?:json)?\s*\n?', '', text).strip()
    cleaned = cleaned.rstrip('`').strip()
    cleaned = re.sub(r':\s*NULL\b', ': null', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r':\s*TRUE\b', ': true', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r':\s*FALSE\b', ': false', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r',\s*([}\]])', r'\1', cleaned)
    return cleaned


def generate_meeting_docx(meeting_text):
    """Convert meeting summary text into a Word document. Returns BytesIO buffer."""
    from docx import Document
    from docx.shared import Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    doc = Document()

    # Style the default font
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Calibri'
    font.size = Pt(11)
    font.color.rgb = RGBColor(0x33, 0x33, 0x33)

    # Title
    title = doc.add_heading('Meeting Summary', level=0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in title.runs:
        run.font.color.rgb = RGBColor(0x1A, 0x1A, 0x2E)

    doc.add_paragraph('')  # spacer

    # Parse the meeting text into sections
    lines = meeting_text.strip().split('\n')
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Detect section headers (numbered like "1. Date..." or markdown headings)
        heading_match = re.match(r'^(?:#{1,3}\s+|(\d+)\.\s*)(.*)', stripped)
        if heading_match:
            heading_text = heading_match.group(2) if heading_match.group(2) else heading_match.group(0)
            is_section = heading_match.group(1) is not None or stripped.startswith('#')
            if is_section:
                h = doc.add_heading(heading_text.strip().rstrip(':'), level=2)
                for run in h.runs:
                    run.font.color.rgb = RGBColor(0x6C, 0x6C, 0xF4)
                continue

        # Detect bullet points
        bullet_match = re.match(r'^[-*\u2022]\s+(.*)', stripped)
        if bullet_match:
            doc.add_paragraph(bullet_match.group(1), style='List Bullet')
            continue

        # Detect sub-items (indented bullets)
        sub_match = re.match(r'^\s+[-*\u2022]\s+(.*)', line)
        if sub_match:
            doc.add_paragraph(sub_match.group(1), style='List Bullet 2')
            continue

        # Bold key-value pairs like "Date: October 1st" or "**Date**: October 1st"
        kv_match = re.match(r'^(?:\*\*)?([^:*]{2,35})(?:\*\*)?:\s*(.*)', stripped)
        if kv_match:
            p = doc.add_paragraph()
            run_key = p.add_run(kv_match.group(1).strip() + ': ')
            run_key.bold = True
            run_key.font.color.rgb = RGBColor(0x1A, 0x1A, 0x2E)
            p.add_run(kv_match.group(2).strip())
            continue

        # Regular paragraph - strip markdown bold markers
        clean_text = re.sub(r'\*\*(.+?)\*\*', r'\1', stripped)
        doc.add_paragraph(clean_text)

    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf


def generate_quiz_docx(quiz_json_str):
    """Convert quiz JSON into a Word document. Returns BytesIO buffer."""
    from docx import Document
    from docx.shared import Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    # Parse quiz data
    sanitized = _sanitize_json(quiz_json_str)
    start = sanitized.find('[')
    end = sanitized.rfind(']')
    if start >= 0 and end > start:
        sanitized = sanitized[start:end + 1]
    questions = json.loads(sanitized)
    if not isinstance(questions, list):
        questions = [questions]

    doc = Document()

    # Style
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Calibri'
    font.size = Pt(11)
    font.color.rgb = RGBColor(0x33, 0x33, 0x33)

    # Title
    title = doc.add_heading('Training Quiz', level=0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in title.runs:
        run.font.color.rgb = RGBColor(0x1A, 0x1A, 0x2E)

    doc.add_paragraph(f'Total Questions: {len(questions)}')
    doc.add_paragraph('')

    # Questions section
    doc.add_heading('Questions', level=1)

    for i, q in enumerate(questions, 1):
        question_text = q.get('question', f'Question {i}')
        difficulty = q.get('difficulty', '')

        # Question heading
        p = doc.add_paragraph()
        run_num = p.add_run(f'Q{i}. ')
        run_num.bold = True
        run_num.font.size = Pt(12)
        run_num.font.color.rgb = RGBColor(0x1A, 0x1A, 0x2E)
        run_q = p.add_run(question_text)
        run_q.font.size = Pt(12)
        if difficulty:
            run_diff = p.add_run(f'  [{difficulty}]')
            run_diff.font.size = Pt(9)
            run_diff.font.color.rgb = RGBColor(0x6C, 0x6C, 0xF4)
            run_diff.italic = True

        # Options
        options = q.get('options', [])
        for j, opt in enumerate(options):
            letter = chr(65 + j)
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Pt(24)
            run = p.add_run(f'{letter}) {opt}')
            run.font.size = Pt(11)

        doc.add_paragraph('')

    # Answer key on new page
    doc.add_page_break()
    doc.add_heading('Answer Key', level=1)

    for i, q in enumerate(questions, 1):
        correct = q.get('correct_answer', 'N/A')
        p = doc.add_paragraph()
        run_num = p.add_run(f'Q{i}: ')
        run_num.bold = True
        run_ans = p.add_run(str(correct))
        run_ans.font.color.rgb = RGBColor(0x22, 0x8B, 0x22)
        run_ans.bold = True

    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf


def _sanitize_slide_json(text):
    """Clean LLM output to extract valid JSON for slide data."""
    cleaned = _sanitize_json(text)
    # Find the JSON array
    start = cleaned.find('[')
    end = cleaned.rfind(']')
    if start >= 0 and end > start:
        cleaned = cleaned[start:end + 1]
    return cleaned


def generate_pptx(slide_json_str):
    """Convert slide script JSON into a PowerPoint file. Returns BytesIO buffer."""
    from pptx import Presentation
    from pptx.util import Inches, Pt, Emu
    from pptx.dml.color import RGBColor
    from pptx.enum.text import PP_ALIGN

    # Parse the slide data
    sanitized = _sanitize_slide_json(slide_json_str)
    slides_data = json.loads(sanitized)
    if not isinstance(slides_data, list):
        slides_data = [slides_data]

    prs = Presentation()
    # Set 16:9 aspect ratio
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    for slide_data in slides_data:
        slide_layout = prs.slide_layouts[6]  # blank layout
        slide = prs.slides.add_slide(slide_layout)

        # Background fill
        bg = slide.background
        fill = bg.fill
        fill.solid()
        fill.fore_color.rgb = RGBColor(0x1E, 0x1E, 0x2E)

        # Slide number badge (top-right)
        slide_num = slide_data.get('slide_number', '')
        if slide_num:
            num_box = slide.shapes.add_textbox(Inches(11.5), Inches(0.3), Inches(1.2), Inches(0.5))
            tf = num_box.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            run = p.add_run()
            run.text = f"#{slide_num}"
            run.font.size = Pt(14)
            run.font.color.rgb = RGBColor(0x94, 0x94, 0xF8)
            run.font.bold = True

        # Title
        title_text = slide_data.get('title', 'Untitled')
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.6), Inches(10), Inches(1.2))
        tf = title_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        run = p.add_run()
        run.text = title_text
        run.font.size = Pt(32)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0xCD, 0xD6, 0xF4)

        # Accent line under title
        slide.shapes.add_shape(
            1, Inches(0.8), Inches(1.85), Inches(3), Emu(36000)
        ).fill.solid()
        slide.shapes[-1].fill.fore_color.rgb = RGBColor(0x6C, 0x6C, 0xF4)

        # Bullet points
        bullets = slide_data.get('bullets', [])
        if bullets:
            bullet_box = slide.shapes.add_textbox(Inches(0.8), Inches(2.2), Inches(11), Inches(4))
            tf = bullet_box.text_frame
            tf.word_wrap = True
            for i, bullet in enumerate(bullets):
                p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
                p.space_after = Pt(12)
                run = p.add_run()
                run.text = f"\u2022  {bullet}"
                run.font.size = Pt(18)
                run.font.color.rgb = RGBColor(0xBA, 0xC2, 0xDE)

        # Speaker notes
        notes_text = slide_data.get('speaker_notes', '')
        if notes_text:
            notes_slide = slide.notes_slide
            notes_tf = notes_slide.notes_text_frame
            notes_tf.text = notes_text

    buf = io.BytesIO()
    prs.save(buf)
    buf.seek(0)
    return buf
