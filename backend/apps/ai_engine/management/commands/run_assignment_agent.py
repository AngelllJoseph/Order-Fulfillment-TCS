from django.core.management.base import BaseCommand
from apps.ai_engine.services.assignment_agent import AssignmentAgent

class Command(BaseCommand):
    help = 'Runs the AI assignment agent cycle for pending order items'

    def handle(self, *args, **options):
        self.stdout.write('Starting AI Assignment Agent cycle...')
        AssignmentAgent.run_assignment_cycle()
        self.stdout.write(self.style.SUCCESS('AI Assignment Agent cycle completed.'))
