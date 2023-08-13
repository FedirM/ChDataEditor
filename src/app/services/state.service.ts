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
    text: `誰在門外。
那個在門外。
你來找誰。
這是誰告訴你的。
外頭有誰呌門。
誰在客堂拊琴。
那個有痲子的是誰。
那個有痲子的是甚麼人。
是姓張的。
誰有粉不搽在臉上呢。
這些玩藝兒，是誰的。
誰在家裡看門。
誰在廚房裡。
沒有誰。
這是誰的仿圏。
這是誰的鎮紙。
我不曉得是誰的。
你看今天能下雨不能。
那個誰知道。
姜玉山一點羞恥也沒有，他任誰也不怕。
姜玉山一點羞恥也沒有，他管誰也不怕。
你聽聽街上直嚷嚷，誰和誰鬧饑荒呢。
你聽聽街上直吵吵，誰和誰鬧饑荒嗎。
那個人的臭名兒，誰不知道呢。
這裡沒有外人，不是你是誰。
誰肯說誰的瓜兒苦。
誰肯說自己的瓜兒苦。
誰的門口能掛個無事牌呢。
同在一個鄉村，誰不認得誰。
誰也不能體貼我心裡的滋味。
這不是我的不是。不是你的不是是誰的。
你當嚴嚴的囑咐他，任誰不要告訴。
你當切切的囑咐他，隨便那個不要告訴。
這時候他們正在氣頭上，也不肯讓誰。`
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
