import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, filter, pipe, takeUntil } from 'rxjs';
import { VocaItem } from 'src/app/interfaces/state';
import { StateService } from 'src/app/services/state.service';

@Component({
  selector: 'app-text-vocabulary',
  templateUrl: './text-vocabulary.component.html',
  styleUrls: ['./text-vocabulary.component.css']
})
export class TextVocabularyComponent implements OnInit, OnDestroy {

  onDestroy$ = new Subject();
  word_form: FormGroup;
  word_list!: Array<VocaItem>;
  selected_id = -1;
  selected_sentence = 0;

  constructor(private st: StateService, private fb: FormBuilder) {
    this.word_form = fb.group({
      si: ['', Validators.required],
      pin: ['', Validators.required],
      ua: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.st.state$.pipe(takeUntil(this.onDestroy$)).subscribe(state => {
      for(let i = 0; i < state.sentenceList.length; i++) {
        if(state.sentenceList[i].inFocus) {
          this.word_list = state.sentenceList[i].vocabulary;
          if(i !== this.selected_sentence) {
            this.selected_id = -1;
            this.selected_sentence = i;
          }
        }
      }
    });

    this.word_form.valueChanges
    .pipe(
      filter(el => { return el.si.length && el.ua.length && el.pin.length }),
      debounceTime(400),
      distinctUntilChanged((prev, curr) => (prev.si === curr.si && prev.pin === curr.pin && prev.ua === curr.ua)),
      takeUntil(this.onDestroy$)
    ).subscribe((value) => {
      if(this.selected_id === -1) return;
      this.word_list.at(this.selected_id)!.simplified = value.si;
      this.word_list.at(this.selected_id)!.pin        = value.pin;
      this.word_list.at(this.selected_id)!.ua         = value.ua;
      this.word_list.at(this.selected_id)!.isChecked  = true;

      this.st.patchSentenceVoca(this.selected_sentence, this.word_list);
    });
  }
  

  ngOnDestroy(): void {
    this.onDestroy$.complete();
  }

  changeId(i: number): void {
    this.selected_id = (i === this.selected_id) ? -1 : i;
    this.word_form.patchValue({
      si: this.word_list.at(i)?.simplified,
      pin: this.word_list.at(i)?.pin,
      ua: this.word_list.at(i)?.ua
    });
  }

  hasVoca(): boolean {
    return this.word_list && !!this.word_list.length && this.st.isReadMode();
  }

  isActive(i: number): boolean {
    return i === this.selected_id;
  }

  isChecked(w: VocaItem): boolean {
    return((!!w.simplified.length) && (!!w.pin.length) && (!!w.ua.length));
  }

  getWordId(i: number): string {
    return `word_${i}`;
  }

}
