import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

import Tesseract from 'tesseract.js';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule
  ],
  templateUrl: './homepage.html'
})
export class Homepage implements OnInit {
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isImage = false;

  isLoading = false;
  ocrText = '';
  progress = 0;

  constructor(
    private languageService: LanguageService,
    private translate: TranslateService,
    private router: Router
  ) { }

  ngOnInit() {
    this.translate.use(this.languageService.getLanguage());
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  async uploadFile() {
    if (!this.selectedFile) return;

    this.isLoading = true;
    this.ocrText = '';
    this.progress = 0;

    try {
      const { data } = await Tesseract.recognize(this.selectedFile, 'ita', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            this.progress = Math.round(m.progress * 100);
          }
        },
      });

      sessionStorage.setItem('ocrText', data.text);

      this.router.navigate(['/ocr-result']);
    } catch (err) {
      console.error('Errore OCR:', err);
    } finally {
      this.isLoading = false;
    }
  }

  private handleFile(file: File) {
    this.selectedFile = file;
    this.isImage = file.type.startsWith('image/');
    if (this.isImage) {
      const reader = new FileReader();
      reader.onload = () => (this.previewUrl = reader.result as string);
      reader.readAsDataURL(file);
    } else {
      this.previewUrl = null;
    }
  }
}
