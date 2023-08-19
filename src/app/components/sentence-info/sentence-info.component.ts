import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, filter, takeUntil, take } from 'rxjs';
import { Sentence } from 'src/app/interfaces/state';
import { StateService } from 'src/app/services/state.service';

@Component({
  selector: 'app-sentence-info',
  templateUrl: './sentence-info.component.html',
  styleUrls: ['./sentence-info.component.css']
})
export class SentenceInfoComponent implements OnInit, OnDestroy {
  onDestroy$ = new Subject();
  sentence_form: FormGroup;
  sentence_list!: Array<Sentence>;
  selected_id = -1;
  selected_ch = '';

  constructor(private st: StateService, private fb: FormBuilder) {
    this.sentence_form = fb.group({
      pin: ['', Validators.required],
      ua: ['', Validators.required],
      simplified: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.st.state$.pipe(take(1)).subscribe(state => {
      this.sentence_list = state.sentenceList;
      this.selected_id = -1;
      for(let s of state.sentenceList){
        if(s.inFocus) {
          this.selected_id = s.id;
          if(this.selected_ch !== s.data) {
            this.selected_ch = s.data;
            this.sentence_form.patchValue({
              pin: s.pin,
              ua: s.ua,
              simplified: s.simplified
            });
          }
          
          break;
        }
      }
    });

    this.sentence_form.valueChanges
    .pipe(
      filter(val => val.pin.length && val.ua.length && val.simplified.length ),
      debounceTime(400),
      distinctUntilChanged((prev, curr) => {
        return prev.ua === curr.ua && prev.pin === curr.pin;
      }),
      takeUntil(this.onDestroy$)
    ).subscribe((value) => {
      if(this.hasSelectedSentence()){
        this.sentence_list[this.selected_id].pin = value.pin;
        this.sentence_list[this.selected_id].ua = value.ua;
        this.sentence_list[this.selected_id].simplified = value.simplified;
        this.st.patchSentences(this.sentence_list);
      }
    });
  }

  get selected_sentence(): Sentence {
    return this.sentence_list[this.selected_id]
  }

  hasSelectedSentence(): boolean {
    return (this.selected_id !== -1) && this.st.isReadMode();
  }

  ngOnDestroy(): void {
    this.onDestroy$.complete();
  }
  
}
