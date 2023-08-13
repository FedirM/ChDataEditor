import { invoke } from '@tauri-apps/api/tauri';

import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SettingsComponent } from '../settings/settings.component';
import { Sentence } from 'src/app/interfaces/state';
import { StateService, Mode } from 'src/app/services/state.service';
import { Subject, takeUntil } from 'rxjs';


@Component({
  selector: 'app-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.css']
})
export class TextEditorComponent implements OnInit, OnDestroy {

  private onDestroy$ = new Subject();
  view!: Mode;
  sentenceList: Array<Sentence> = [];
  text = '';

  constructor(
    private modalService: NgbModal,
    private st: StateService
  ) { }

  ngOnInit(): void {
    this.st.state$.pipe(takeUntil(this.onDestroy$)).subscribe((state) => {
      this.text = state.text;
      this.sentenceList = state.sentenceList;
    });

    this.st.mode$.pipe(takeUntil(this.onDestroy$)).subscribe(mode => this.view = mode);
  }

  ngOnDestroy(): void {
    this.onDestroy$.complete();
  }

  isEditorMode(): boolean {
    return this.view === Mode.Editor;
  }

  selectSentence(id: number): void {
    for(let s of this.sentenceList) {
      if( s.inFocus && s.id !== id ) {
        s.inFocus = false;
        s.isChecked = this.isChecked(id);
      }
      if( s.id === id ) {
        s.inFocus = true;
      }
    }
    this.st.patchSentences(this.sentenceList);
  }

  changeMode(): void {
    if(this.view === Mode.Editor) {
      this.st.patchText(this.text);
      this.view = Mode.Reader;
      Promise.all([
        invoke('google_translator_hi', {text: this.text}),
        invoke('google_translator_ua', {text: this.text})
      ]).then(res => {console.log('RES: ', res)})
      .catch(err => console.error(err));
      
      // invoke('google_translator_hi', {text: this.text})
      // .then(res => console.log('RES: ', res))
      // .catch(err => console.error(err));
      
      // invoke('google_translator_ua', {text: this.text})
      // .then(res => console.log('RES: ', res))
      // .catch(err => console.error(err));
    } else {
      this.view = Mode.Editor;
      // Promise.all([
      //   invoke('close_hi_win'),
      //   invoke('close_ua_win')
      // ]).then(res => {
      //   console.log('Close: ', res);
      // }).catch(err => {
      //   console.log('Err: ', err);
      // });
      invoke('close_all_text_win').then(res => {
        console.log('Close hi win');
      }).catch(err => {
        console.log('Err: ', err);
      });
      // invoke('close_ua_win').then(res => {
      //   console.log('Close ua win');
      // }).catch(err => {
      //   console.log('Err: ', err);
      // });
    }
    this.st.patchMode(this.view);
  }

  getLabel(): String {
    return (this.view === Mode.Editor) ? 'Read' : 'Edit';
  }

  openSettings() {
    const modalRef = this.modalService.open(SettingsComponent);
    modalRef.componentInstance.name = 'Kek';
  }

  isChecked(id: number): boolean {
    const s = this.sentenceList[id];
    //check voca
    for(let v of s.vocabulary) {
      if(!v.isChecked) return false;
    }

    return !!s.pin.length && !!s.ua.length;
  }
}
