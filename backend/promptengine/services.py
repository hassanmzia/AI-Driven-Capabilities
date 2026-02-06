"""
Core prompt engineering services - implements all 5 notebook features
plus custom prompt execution.
"""
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
