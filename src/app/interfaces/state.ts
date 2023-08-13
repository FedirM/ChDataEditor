
export interface State {
    text: string;
    sentenceList: Array<Sentence>;
    unlisted: Array<string>;
}

export interface Sentence {
    id: number;
    data: string;
    simplified: string;
    pin: string;
    ua: string;
    isChecked: boolean;
    inFocus: boolean;
    vocabulary: Array<VocaItem>
}

export interface VocaItem {
    hi: string;
    simplified: string;
    pin: string;
    ua: string;
    nest: Nest | any;
    isChecked: boolean;
    inFocus: boolean;
}

export interface Dictionary extends Object {
    [hi: string]: Nest | any
}

export interface Nest {
    ex?: string;
    pin: string;
    ru: string;
}