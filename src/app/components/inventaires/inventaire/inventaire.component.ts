import { registerLocaleData } from '@angular/common';
import { Component, LOCALE_ID, OnInit } from '@angular/core';
import localeFr from '@angular/common/locales/fr';
import { Router } from '@angular/router';
import { ProduitService } from 'src/app/services/produit.service';
import { UserService } from 'src/app/services/user.service';
import { PaymentService } from 'src/app/services/payment.service';
import { ParametreService } from 'src/app/services/parametre.service';
registerLocaleData(localeFr, 'fr')
declare const bootstrap: any;

@Component({
  selector: 'app-inventaire',
  templateUrl: './inventaire.component.html',
  styleUrls: ['./inventaire.component.scss'],
  providers: [{ provide: LOCALE_ID, useValue: 'fr' }]
})


export class InventaireComponent implements OnInit {

  firstRoleName: string | null = null; // Contiendra le premier nom de rôle

  produit: any;
  settingPayment: any;
  hostname: any;
  reference: any;

  constructor(public produitService: ProduitService, public router: Router,
    public userService: UserService, public paymentService: PaymentService,
    public parametreService: ParametreService,) { }

  ngOnInit() {
    this.refreshRoleAndPermissonsUser();
    // Vérifier si les rôles existent dans l'utilisateur
    if (this.userService.user.roles && this.userService.user.roles.length > 0) {
      // Extraire le nom du premier rôle
      this.firstRoleName = this.userService.user.roles[0].name;
    }
    if (localStorage.getItem('produitInventaire') != null) {
      this.produit = JSON.parse(localStorage.getItem('produitInventaire')!);
    } else {
      this.router.navigate(['/produit'])
    }

    this.checkpaiement();
  }

  checkpaiement() {
    this.parametreService.getSettingIconeStock().subscribe(data => {
      let resp: any = data;
      const settingPaymentList = resp.payments;
      const hostname = window.location.hostname;
      if (!hostname.startsWith('www.')) {
        this.hostname = `www.${hostname}`;
      } else {
        this.hostname = hostname;
      }
      const settingPayment = settingPaymentList.filter((item: any) => item.client === this.hostname && item.module === 'détail produit');
      this.settingPayment = settingPayment[0];
      if (this.settingPayment?.check == 0) {
        this.reference = this.settingPayment?.reference;
        const openModal = document.getElementById('modalPayDetailProduct') as HTMLElement;
        const modalInstance = bootstrap.Modal.getInstance(openModal) || new bootstrap.Modal(openModal);
        modalInstance.show();
      }
    });
  }

  refreshRoleAndPermissonsUser(): void {
    this.userService.refreshRoleAndPermissonsUser(this.userService.user.id).subscribe(data => {
      let resp: any = data;
      this.userService.user.permissions = resp.user.permissions;
      this.userService.setRoles(resp.user.roles);
    });
  }

  essaie() {
    this.parametreService.getEssaieIconeStock(this.reference).subscribe(data => {
      let resp: any = data;
      const openModal = document.getElementById('modalPayDetailProduct') as HTMLElement;
      const modalInstance = bootstrap.Modal.getInstance(openModal) || new bootstrap.Modal(openModal);
      modalInstance.hide();
    });
  }

  get totalTothtAchat(): number {
    return this.produit?.achat?.reduce((sum: number, a: any) => sum + (a.totht || 0), 0) || 0;
  }

  get totalTothtVente(): number {
    return this.produit?.vente?.reduce((sum: number, a: any) => sum + (a.totht || 0), 0) || 0;
  }

  getStockStatus(qty: number, qtyAlert: number): { label: string, class: string, icon: string } {
    if (qty === 0) {
      return { label: 'Terminé', class: 'bg-danger', icon: 'fa-times-circle' };
    } else if (qty <= qtyAlert) {
      return { label: 'Presque terminé', class: 'bg-warning text-dark', icon: 'fa-exclamation-triangle' };
    } else {
      return { label: 'En stock', class: 'bg-success', icon: 'fa-check-circle' };
    }
  }



}
