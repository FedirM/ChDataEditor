import { Injectable } from '@angular/core';
import { invoke } from "@tauri-apps/api/tauri";

@Injectable({
  providedIn: 'root'
})
export class TextProcessorService {

  private _sentence_re  = RegExp(/[。]{1,}/);
  private _cleaner_re   = RegExp(/[\p{P}\s\d]/u);
  private _han_re       = RegExp(/\p{sc=Han}/u);


  constructor() { }

  get sentence_re(): RegExp {
    return this._sentence_re;
  }
  
  get cleaner_re(): RegExp {
    return this._cleaner_re;
  }
  
  get han_re(): RegExp {
    return this._han_re;
  }

  split_by_sentence(text: String): Array<String> {
    if (!text.length) return [];
    return text.split(this._sentence_re).filter(el => el).map(el => el.trim());
  }
  
  split_by_word(text: String): Array<String> {
    if(!text.length) return [];
    return text.split(this._cleaner_re).filter(el => el);
  }

  vocabulary(text: String): Promise<{}> {
    if(!text.length) return Promise.resolve({});
    let chunks = this.split_by_word(text);
    if(!chunks.length) return Promise.resolve({});
    return invoke('vocabulary', { chunks });
  }
  
}
