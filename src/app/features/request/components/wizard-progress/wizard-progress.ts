import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SchemaSection } from '../../../../core/models/request.models';

@Component({
  selector: 'app-wizard-progress',
  imports: [],
  templateUrl: './wizard-progress.html',
  styleUrl: './wizard-progress.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardProgress {
  readonly sections = input.required<SchemaSection[]>();
  readonly activeIndex = input.required<number>();
  readonly sectionSelected = output<string>();
}
