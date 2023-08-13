import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Mode, StateService } from "./services/state.service";
import { Subject, takeUntil } from "rxjs";
import { TextEditorComponent } from "./components/text-editor/text-editor.component";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit, OnDestroy {
  
  @ViewChild(TextEditorComponent) editor!: TextEditorComponent;


  private onDestroy$ = new Subject();
  splitAreaSizes = [60, 40];
  isVocaChecked = false;
  isTextChecked = false;
  isTabDisabled = false;

  constructor(private st: StateService) {
    const sizes = localStorage.getItem('splitAreaSizes');
    if(sizes) {
      this.splitAreaSizes = JSON.parse(sizes);
    }
  }

  ngOnInit(): void {
    this.st.state$
    .pipe(takeUntil(this.onDestroy$))
    .subscribe(state => {
      top: for(let s of state.sentenceList) {
        if(s.inFocus) {
          this.isTextChecked = (!!s.ua.length && !!s.pin.length && !!s.simplified.length);
          this.isVocaChecked = true;
          for(let v of s.vocabulary) {
            if(!v.isChecked) {
              this.isVocaChecked = false;
              break top;
            }
          }
        }
      }
    });

    this.st.mode$
    .pipe(takeUntil(this.onDestroy$))
    .subscribe(m => {
      this.isTabDisabled = m === Mode.Editor;
      console.log('Is disabled: ', this.isTabDisabled);
    })
  }

  ngOnDestroy(): void {
    this.onDestroy$.complete();
  }

  onDragSplitArea(data: any): void {
    console.log('On drag: ', data);
    localStorage.setItem('splitAreaSizes', JSON.stringify(data.sizes));
  }
  
}
