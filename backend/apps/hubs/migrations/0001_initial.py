import uuid
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='SKU',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('sku_id', models.CharField(max_length=100, unique=True)),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='Hub',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('hub_code', models.CharField(max_length=50, unique=True)),
                ('name', models.CharField(max_length=255)),
                ('location', models.CharField(max_length=255)),
                ('contact_person', models.CharField(blank=True, max_length=255, null=True)),
                ('contact_email', models.EmailField(blank=True, max_length=254, null=True)),
                ('contact_phone', models.CharField(blank=True, max_length=20, null=True)),
                ('max_daily_capacity', models.IntegerField(default=500)),
                ('max_concurrent_orders', models.IntegerField(default=100)),
                ('current_load', models.IntegerField(default=0)),
                ('production_lead_time', models.CharField(blank=True, help_text='e.g., 24-48 hours', max_length=100, null=True)),
                ('operating_hours', models.CharField(blank=True, help_text='e.g., 9 AM - 6 PM, Mon-Sat', max_length=255, null=True)),
                ('status', models.CharField(choices=[('ACTIVE', 'Active'), ('INACTIVE', 'Inactive'), ('MAINTENANCE', 'Maintenance')], default='ACTIVE', max_length=20)),
                ('auto_assignment_enabled', models.BooleanField(default=True)),
                ('priority_level', models.IntegerField(default=1)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Manufacturing Hub',
                'verbose_name_plural': 'Manufacturing Hubs',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='HubSKUMapping',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('production_time', models.IntegerField(help_text='Time in minutes')),
                ('parts_required', models.IntegerField(default=1)),
                ('is_enabled', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('hub', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sku_mappings', to='hubs.hub')),
                ('sku', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='hub_mappings', to='hubs.sku')),
            ],
            options={
                'verbose_name': 'Hub SKU Mapping',
                'verbose_name_plural': 'Hub SKU Mappings',
                'unique_together': {('hub', 'sku')},
            },
        ),
    ]
