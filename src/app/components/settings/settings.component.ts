import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
	
	settingsGroup!: FormGroup;

	constructor(
		public activeModal: NgbActiveModal,
		private fb: FormBuilder
	) {
		this.initForm();
	}

	private initForm(): void {
		const styles = getComputedStyle(document.documentElement);
		this.settingsGroup = this.fb.group({
			fontSize: [styles.getPropertyValue('--text-size'), Validators.required],
			bottomPadding: [styles.getPropertyValue('--bottom-padding'), Validators.required],
			checkedColor: [this.rgbToHex(styles.getPropertyValue('--checked-text')), Validators.required],
			activeColor: [this.rgbToHex(styles.getPropertyValue('--active-color')), Validators.required]
		});
	}

	rgbToHex(rgb: string) {
		let m = rgb.match(/\((\d+), (\d+), (\d+)\)/);
		if( m && m.length > 2 ) {
			return "#" + (1 << 24 | Number(m[1]) << 16 | Number(m[2]) << 8 | Number(m[3])).toString(16).slice(1);
		} else {
			return rgb;
		}
	}

	onSaveClick(): void {
		if(this.settingsGroup.valid) {
			const values = this.settingsGroup.value;
			const styles = document.documentElement.style;
			styles.setProperty('--text-size', values.fontSize);
			styles.setProperty('--bottom-padding', values.bottomPadding);
			styles.setProperty('--checked-text', values.checkedColor);
			styles.setProperty('--active-color', values.activeColor);
			
			localStorage.setItem('css_variables', JSON.stringify(values));
		}


		this.activeModal.close();
	}
}
