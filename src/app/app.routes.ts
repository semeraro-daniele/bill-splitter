import { Routes } from '@angular/router';
import { ErrorPage } from './shared/error-page/error-page';
import { Homepage } from './pages/homepage/homepage';
import { OCRResult } from './pages/ocr-result/ocr-result';
import { SplitBill } from './pages/split-bill/split-bill';

export const routes: Routes = [
  { path: '', redirectTo: 'homepage', pathMatch: 'full' },
  { path: 'homepage', component: Homepage },
  { path: 'ocr-result', component: OCRResult },
  { path: 'split-bill', component: SplitBill },
  { path: '**', pathMatch: 'full', component: ErrorPage },
];
