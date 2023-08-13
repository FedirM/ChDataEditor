import { Component, OnDestroy, OnInit } from '@angular/core';
import { invoke } from '@tauri-apps/api';
import { save } from '@tauri-apps/api/dialog';
import { writeTextFile } from '@tauri-apps/api/fs';
import { Subject, takeUntil, take } from 'rxjs';
import { Mode, StateService } from 'src/app/services/state.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit, OnDestroy {

  private onDestroy$ = new Subject();
  private mode!: Mode;

  isSaveDisabled = true;

  constructor(private st: StateService) {}

  ngOnInit(): void {
    this.st.mode$
    .pipe(takeUntil(this.onDestroy$))
    .subscribe(mode => {
      this.mode = mode;
    });

    this.st.state$
    .pipe(takeUntil(this.onDestroy$))
    .subscribe(state => {
      this.isSaveDisabled = state.sentenceList.length === 0;
      for(let s of state.sentenceList){
        if(!s.isChecked) {
          this.isSaveDisabled = true;
          break;
        }
      }
      console.log('is: ', this.isSaveDisabled);

      invoke("google_voca_close").then(res => {}).catch(console.error);
    });
  }

  ngOnDestroy(): void {
    this.onDestroy$.complete();
  }

  get isEditorMode(): boolean {
    return this.mode === Mode.Editor;
  }

  onVocaClick(): void {
    this.st.state$
    .pipe(take(1))
    .subscribe(state => {
      let voca: string[] = [];
      for(let s of state.sentenceList) {
        if(s.inFocus) {
          voca = s.vocabulary.map(el => el.hi);
          break;
        }
      }
      if(voca.length) {
        invoke("google_voca", {list: voca.join('\n')})
        .then(res => {}).catch(console.error);
      }
    });
  }

  onSaveText(): void {
    const suggestedFilename = '';
    save({
      defaultPath: '/' + suggestedFilename,
      filters: [{
        name: 'lesson-text',
        extensions: ['csv']
      }]
    }).then(filePath => {
      if(!filePath) return;
      const data = this.prepareTextData();
      writeTextFile(filePath, data)
      .then(console.log)
      .catch(console.error);
    }).catch(console.error);
  }

  onSaveVoca(): void {
    const suggestedFilename = '';
    save({
      defaultPath: '/' + suggestedFilename,
      filters: [{
        name: 'lesson-voca',
        extensions: ['csv']
      }]
    }).then(filePath => {
      if(!filePath) return;
      const data = this.prepareVocaData();
      writeTextFile(filePath, data)
      .then(console.log)
      .catch(console.error);
    }).catch(console.error);
  }

  private prepareTextData(): string {
    let data: string[] = [];
    for(let s of this.st.sentences) {
      data.push(`${s.data}|${s.simplified}|${s.pin}|${s.ua}`);
    }
    return data.join('\n');
  }

  private prepareVocaData(): string {
    let data: string[] = [];
    for(let s of this.st.sentences) {
      for(let voca of s.vocabulary) {
        data.push(`${voca.hi}|${voca.simplified}|${voca.pin}|${voca.ua}`);
      }
    }
    return data.join('\n');
  }
}
