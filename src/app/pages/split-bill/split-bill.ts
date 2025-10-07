import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Item } from '../../models/item';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-split-bill',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    RouterModule
  ],
  templateUrl: './split-bill.html'
})
export class SplitBill {
  text: string = '';
  items: Item[] = [];
  people: string[] = [];
  totals: Record<string, number> = {};

  newPerson = '';

  constructor(
    private languageService: LanguageService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.translate.use(this.languageService.getLanguage());
    const savedText = sessionStorage.getItem('cleanText');
    this.text = savedText || 'Nessun testo disponibile.';

    if (savedText) {
      this.parseItems(savedText);
    }
  }

  addPerson() {
    if (this.newPerson.trim() && !this.people.includes(this.newPerson.trim())) {
      this.people.push(this.newPerson.trim());
      this.newPerson = '';
    }
  }

  assignPerson(item: Item, person: string) {
    item.assignedTo = person;
    this.updateTotals();
  }

  updateTotals() {
    for (const item of this.items) {
      const quantita = item.quantita || 1;
      const prezzo = item.prezzo || 0;
      const sconto = item.sconto || 0;
      const iva = item.iva ? item.iva / 100 : 0;

      const prezzoBase = prezzo * quantita;
      const prezzoConIva = prezzoBase + (prezzoBase * iva);
      item.prezzoFinale = prezzoConIva - sconto;
    }

    const totals: Record<string, number> = {};

    for (const item of this.items) {
      if (item.assignments && item.prezzoFinale != null && item.quantita) {
        const unitPrice = item.prezzoFinale / item.quantita;
        for (const assign of item.assignments) {
          if (!assign.person) continue;
          const subtotal = unitPrice * assign.quantity;
          totals[assign.person] = (totals[assign.person] || 0) + subtotal;
        }
      }
    }

    this.totals = { ...totals };
    this.items = [...this.items];
  }

  addAssignment(item: Item) {
    if (!item.assignments) item.assignments = [];
    item.assignments.push({ person: this.people[0] || '', quantity: 1 });
    this.updateTotals();
  }

  getMaxAssignable(item: Item, assign: { person: string; quantity: number }): number {
    const total = item.quantita || 1;
    const assigned = item.assignments?.reduce((sum, a2) => sum + (a2.quantity || 0), 0) || 0;
    const current = assign.quantity || 0;
    return total - (assigned - current);
  }

  isFullyAssigned(item: Item): boolean {
    const total = item.quantita || 1;
    const assigned = item.assignments?.reduce((sum, a) => sum + (a.quantity || 0), 0) || 0;
    return assigned >= total;
  }

  removeAssignment(item: Item, assign: { person: string; quantity: number }) {
    item.assignments = item.assignments?.filter(a => a !== assign);
    this.updateTotals();
  }

  getDetailedTotals() {
    const details: Record<string, { items: { name: string; quantity: number; subtotal: number; unit: number }[], total: number }> = {};

    for (const item of this.items) {
      if (item.assignments && item.prezzoFinale != null && item.quantita) {
        const unitPrice = item.prezzoFinale / item.quantita;

        for (const assign of item.assignments) {
          if (!assign.person) continue;

          const subtotal = unitPrice * assign.quantity;

          if (!details[assign.person]) {
            details[assign.person] = { items: [], total: 0 };
          }

          details[assign.person].items.push({
            name: item.nome,
            quantity: assign.quantity,
            subtotal,
            unit: unitPrice
          });

          details[assign.person].total += subtotal;
        }
      }
    }

    return details;
  }

  parseItems(text: string) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const items: Item[] = [];

    const itemRegex = /^([A-Z0-9' .\-]+?)\s+(\d+)%\s+([\d,]+)$/;
    const discountRegex = /^Sconto.+?([\d,]+)$/i;

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(itemRegex);
      if (match) {
        const nome = match[1].trim();
        const iva = parseInt(match[2]);
        const prezzo = parseFloat(match[3].replace(',', '.'));
        const item: Item = { nome, iva, prezzo };

        let nextLineIndex = i + 1;
        const next = lines[nextLineIndex];
        const qtyMatch = next?.match(/Cad\s+([\d,.]+)\s+Pz\.?\s*(\d+)/i);
        if (qtyMatch) {
          const prezzoCad = parseFloat(qtyMatch[1].replace(',', '.'));
          const quantita = parseInt(qtyMatch[2]);
          item.quantita = quantita;
          nextLineIndex++; // Salta la riga della quantità
        } else {
          item.quantita = 1; // Default a 1 se non specificato
        }

        // Cerca lo sconto nella riga successiva
        const discountLine = lines[nextLineIndex]?.match(discountRegex);
        if (discountLine && item.prezzo != null) {
          const sconto = Math.abs(parseFloat(discountLine[1].replace(',', '.')));
          item.sconto = sconto;
          item.prezzoFinale = +(item.prezzo - sconto).toFixed(2);
        } else {
          item.prezzoFinale = item.prezzo ?? 0;
        }

        item.assignments = [];
        item.showSplit = false;

        items.push(item);
      }
    }

    this.items = items;
    this.updateTotals();
  }
}
