import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, take } from 'rxjs';
import { StateService } from 'src/app/services/state.service';

@Component({
  selector: 'app-new-word',
  templateUrl: './new-word.component.html',
  styleUrls: ['./new-word.component.css']
})
export class NewWordComponent {
  
  // private onDestroy$ = new Subject();
  form: FormGroup;

  constructor(private st: StateService, private fb: FormBuilder) {
    this.form = fb.group({
      hi: ['', Validators.required],
      si: ['', Validators.required],
      pin: ['', Validators.required],
      ua: ['', Validators.required]
    });
  }

  onSave(): void {
    if(this.form.valid) {
      const value = this.form.value;
      this.st.state$.pipe(take(1)).subscribe(state => {
        for(let s of state.sentenceList) {
          if(s.inFocus) {
            s.vocabulary.unshift({
              inFocus: false,
              isChecked: true,
              hi: value.hi,
              simplified: value.si,
              pin: value.pin,
              ua: value.ua,
              nest: null
            });
            this.st.patchSentences(state.sentenceList);
            this.form.reset();
            break;
          }
        }
      })
    }
    
    this.st.state$.subscribe(data => {
      console.log('Patch sentences: ', data.sentenceList);
    })
  }

  isAvailable(): boolean {
    return this.st.isReadMode();
  }

  // ngOnDestroy(): void {
  //   this.onDestroy$.next(true);
  // }
}
