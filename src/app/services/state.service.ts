import { Injectable } from '@angular/core';
import { State, Dictionary, Sentence, VocaItem } from '../interfaces/state';
import { TextProcessorService } from './text-processor.service';
import { BehaviorSubject, Observable, map } from 'rxjs';

export enum Mode {
  Editor = 0,
  Reader = 1
}

@Injectable({
  providedIn: 'root'
})
export class StateService {

  private _mode = new BehaviorSubject(Mode.Editor);
  private _state: BehaviorSubject<State>;
  private _default_state: State = {
    sentenceList: [],
    unlisted: [],
    text: '这是什么？'
  }

  constructor(private tp: TextProcessorService) {
    this._state = new BehaviorSubject(this._default_state);
  }

  get state$(): Observable<State> {
    return this._state.asObservable();
  }

  get mode$(): Observable<Mode> {
    return this._mode.asObservable();
  }

  get sentences(): Sentence[] {
    return this._state.value.sentenceList;
  }

  isReadMode(): boolean {
    return this._mode.value === Mode.Reader;
  }

  patchMode(mode: Mode) {
    this._mode.next(mode);
  }

  private getSelectedSentence(): Sentence | null {
    if(this._state.value.sentenceList.length) {
      for(let s of this._state.value.sentenceList) {
        if(s.inFocus) {
          return s;
        }
      }
      return this._state.value.sentenceList[0];
    }
    return null;
  }

  patchText(text: string) {
    const ss = this.getSelectedSentence();
    let sentenceInFocus = (ss) ? ss.id : 0;
    
    let s = text
        .split(/[\r\n]/)
        .filter(el => el)
        .map((el, i) => {
          if( this._state.value.sentenceList.length > i &&  this._state.value.sentenceList[i].data === el ) {
            return this._state.value.sentenceList[i];
          } else {
            return {
              id: i,
              isChecked: false,
              inFocus: i === sentenceInFocus,
              data: el,
              simplified: '',
              pin: '',
              ua: '',
              vocabulary: []
            };
          }
        });
    this._state.next({
      ...this._state.value,
      text
    });

    this.patchSentences(s);
  }

  patchSentences(s_list: Array<Sentence>): void {

    for(let s of s_list) {
      let counter = 0;
      for(let w of s.vocabulary) {
        if(w.hi.length && w.pin.length && w.ua.length && w.simplified.length) {
          w.isChecked = true;
          counter++;
        }
      }
      //@ts-ignore
      s.isChecked = ( s.vocabulary.length > 0 &&
                      counter === s.vocabulary.length &&
                      s.data.length && s.simplified.length &&
                      s.pin.length && s.ua.length );
    }

    this._state.next({
      ...this._state.value,
      sentenceList: s_list
    });
    this.getSelectedSentenceVoca();
  }

  patchSentenceVoca(sentence_id: number, voca: Array<VocaItem>): void {
    this._state.value.sentenceList[sentence_id].vocabulary = voca;
    this.patchSentences(this._state.value.sentenceList);
  }

  private getSelectedSentenceVoca(): void {
    const ss = this.getSelectedSentence();
    if(!ss) return;

    this.getVoca(this.tp.split_by_word(ss.data)).then(res => {
      if(!ss.vocabulary.length){
        ss.vocabulary = res;
      } else {
        resLoop: while(res.length) {
          let v = res.pop();
          for(let vv of ss.vocabulary) {
            if(vv.hi === v!.hi) continue resLoop;
          }
          ss.vocabulary.push(v!);
        }
      }

      // this.patchSentenceVoca(ss.id, ss.vocabulary);
      this._state.value.sentenceList[ss.id].vocabulary = ss.vocabulary;
      this._state.next(this._state.value);
    }).catch(err => console.error(err));
  }


  private getVoca(chunk_list: Array<String>): Promise<Array<VocaItem>> {
    if (!this._state.value.text.length) return Promise.resolve([]);
    
    return new Promise((resolve, reject) => {
      let p_arr = chunk_list.map((chunk) => this.tp.vocabulary(chunk));
      Promise.all(p_arr).then((values: Array<Dictionary>) => {
        let obj = [];
        for(let o of values) {
          for(let [k,v] of Object.entries(o)) {
            obj.push({
              hi: k,
              simplified: '',
              pin: (v && Object.hasOwn(v, 'pin')) ? v.pin : '',
              ua: '',
              nest: v,
              isChecked: false,
              inFocus: false
            });          
          }
        }
        resolve(obj);
      }).catch(err => {
        reject(err);
      })
    });
  }

}
