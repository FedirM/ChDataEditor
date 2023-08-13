import { APP_INITIALIZER, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AngularSplitModule } from 'angular-split';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from "./app.component";
import { TextVocabularyComponent } from "./components/text-vocabulary/text-vocabulary.component";
import { TextEditorComponent } from './components/text-editor/text-editor.component';
import { NewWordComponent } from './components/new-word/new-word.component';
import { SentenceInfoComponent } from './components/sentence-info/sentence-info.component';
import { EmptyListComponent } from './components/empty-list/empty-list.component';
import { MenuComponent } from './components/menu/menu.component';



function appInit(): Promise<void> {
  return new Promise((resolve, reject) => {
    const css_str = localStorage.getItem('css_variables');
    console.log('LOCALSTORAGE: ', css_str);
    if(css_str) {
      const styles = document.documentElement.style;
      const values = JSON.parse(css_str);
			styles.setProperty('--text-size', values.fontSize);
			styles.setProperty('--bottom-padding', values.bottomPadding);
			styles.setProperty('--checked-text', values.checkedColor);
			styles.setProperty('--active-color', values.activeColor);
    }
    resolve();
  });
}

@NgModule({
  declarations: [
    AppComponent,
    TextVocabularyComponent,
    TextEditorComponent,
    NewWordComponent,
    SentenceInfoComponent,
    EmptyListComponent,
    MenuComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgbNavModule,
    AngularSplitModule,
  ],
  providers: [{
    provide: APP_INITIALIZER,
    useFactory: () => appInit,
    multi: true
  }],
  bootstrap: [AppComponent],
})
export class AppModule {}
