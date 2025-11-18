import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-ocr-result',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    RouterModule
  ],
  templateUrl: './ocr-result.html'
})
export class OCRResult {
  text: string = '';
  cleanText: string = '';

  constructor(
    private router: Router,
    private languageService: LanguageService,
    private translate: TranslateService,
  ) { }

  ngOnInit() {
    this.translate.use(this.languageService.getLanguage());

    const savedText = sessionStorage.getItem('ocrText');
    this.text = savedText || 'Nessun testo disponibile.';
    this.extractRelevantSection();
  }

  extractRelevantSection() {
    const regex = /DESCRIZIONE[\s\S]*?DI CUI IVA.*?(?:\r?\n|$)/i;
    const match = this.text.match(regex);

    if (match) {
      let section = match[0].trim();

      section = section
        .replace(/SUBTOTALE[\s\S]*/i, '')
        .replace(/TOTALE COMPLESSIVO[\s\S]*/i, '')
        .replace(/DI CUI IVA[\s\S]*/i, '')
        .trim();

      this.cleanText = section;
      sessionStorage.setItem('cleanText', this.cleanText);
    } else {
      this.cleanText = 'Sezione non trovata.';
    }
  }

  goToSplitBill() {
    this.router.navigate(['/split-bill']);
  }
}
