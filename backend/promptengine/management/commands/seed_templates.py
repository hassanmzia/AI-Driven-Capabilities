"""Seed built-in prompt templates derived from the notebook."""
from django.core.management.base import BaseCommand
from promptengine.models import PromptTemplate
from promptengine.services import SYSTEM_PROMPTS


SEED_TEMPLATES = [
    {
        'name': 'Healthcare Feedback Analyzer',
        'description': 'Extracts structured insights from patient/customer reviews including sentiment, ratings, satisfaction, and issue tags.',
        'category': 'feedback_analysis',
        'difficulty': 'beginner',
        'system_prompt': SYSTEM_PROMPTS['feedback_analysis'],
        'user_prompt_template': '---\nHere is the data:\n{review_text}',
        'example_input': 'John Smith - I recently had the privilege of consulting with Dr. Emily Roberts...',
        'example_output': '{"patient_name": "John Smith", "consulting_doctor": "Dr. Emily Roberts", "review_rating": 5, ...}',
        'tags': ['healthcare', 'sentiment', 'NER', 'structured-output'],
        'parameters': {'review_text': {'type': 'textarea', 'label': 'Customer/Patient Review', 'required': True}},
    },
    {
        'name': 'Meeting Notes Summarizer',
        'description': 'Summarizes meeting transcripts into structured notes with objectives, participants, discussion points, and action items.',
        'category': 'meeting_summarizer',
        'difficulty': 'beginner',
        'system_prompt': SYSTEM_PROMPTS['meeting_summarizer'],
        'user_prompt_template': '---\nBelow is the transcript:\n{transcript}',
        'example_input': 'John: Good morning, everyone. Thanks for joining this kickoff meeting...',
        'example_output': '1. Date: ...\n2. Objective: ...\n3. Participants: ...',
        'tags': ['meetings', 'summarization', 'productivity', 'action-items'],
        'parameters': {'transcript': {'type': 'textarea', 'label': 'Meeting Transcript', 'required': True}},
    },
    {
        'name': 'Training Quiz Generator',
        'description': 'Generates multiple-choice quizzes from provided text content with configurable difficulty levels.',
        'category': 'quiz_generator',
        'difficulty': 'intermediate',
        'system_prompt': SYSTEM_PROMPTS['quiz_generator'],
        'user_prompt_template': 'Generate {num_questions} questions with difficulty: {difficulty_mix}\n---\nBelow is the information:\n{content}',
        'example_input': 'Introduction to Generative AI and Language Models...',
        'example_output': '[{"question": "What is ...", "options": ["A", "B", "C", "D"], "correct_answer": "A", "difficulty": "easy"}]',
        'tags': ['education', 'quiz', 'training', 'assessment'],
        'parameters': {
            'content': {'type': 'textarea', 'label': 'Source Content', 'required': True},
            'num_questions': {'type': 'number', 'label': 'Number of Questions', 'default': 5, 'min': 1, 'max': 20},
            'difficulty_mix': {'type': 'text', 'label': 'Difficulty Mix', 'default': '2 easy, 2 intermediate, 1 hard'},
        },
    },
    {
        'name': 'Presentation Slide Script',
        'description': 'Generates structured slide scripts with titles, bullet points, and speaker notes for presentations.',
        'category': 'slide_script',
        'difficulty': 'intermediate',
        'system_prompt': SYSTEM_PROMPTS['slide_script'],
        'user_prompt_template': 'Generate a {style} slide script on: {topic}\nCreate exactly {num_slides} slides.',
        'example_input': 'Topic: Cryptocurrency, 3 slides, professional style',
        'example_output': '[{"slide_number": 1, "title": "...", "bullets": [...], "speaker_notes": "..."}]',
        'tags': ['presentation', 'slides', 'content-generation', 'business'],
        'parameters': {
            'topic': {'type': 'text', 'label': 'Presentation Topic', 'required': True},
            'num_slides': {'type': 'number', 'label': 'Number of Slides', 'default': 3, 'min': 1, 'max': 20},
            'style': {'type': 'select', 'label': 'Style', 'default': 'professional', 'options': ['professional', 'casual', 'academic', 'sales']},
        },
    },
    {
        'name': 'Customer Complaint Responder',
        'description': 'Generates professional, empathetic responses to customer complaints with sentiment analysis.',
        'category': 'complaint_response',
        'difficulty': 'beginner',
        'system_prompt': SYSTEM_PROMPTS['complaint_response'],
        'user_prompt_template': 'User complaint:\n{complaint}',
        'example_input': 'My smart refrigerator has started ordering ice cream on its own...',
        'example_output': 'Dear Customer, Thank you for reaching out...',
        'tags': ['customer-support', 'sentiment', 'response-generation', 'empathy'],
        'parameters': {
            'complaint': {'type': 'textarea', 'label': 'Customer Complaint', 'required': True},
            'company_name': {'type': 'text', 'label': 'Company Name', 'default': 'TechFast'},
            'agent_name': {'type': 'text', 'label': 'Agent Name', 'default': 'Alex'},
        },
    },
]


class Command(BaseCommand):
    help = 'Seed built-in prompt templates'

    def add_arguments(self, parser):
        parser.add_argument('--noinput', action='store_true')

    def handle(self, *args, **options):
        created_count = 0
        for tpl_data in SEED_TEMPLATES:
            _, created = PromptTemplate.objects.update_or_create(
                name=tpl_data['name'],
                is_builtin=True,
                defaults=tpl_data,
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Seeded {created_count} new templates (total: {len(SEED_TEMPLATES)})'))
