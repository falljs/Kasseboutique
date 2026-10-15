import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InventaireService } from 'src/app/services/inventaire.service';
import { ProduitService } from 'src/app/services/produit.service';
import { UserService } from 'src/app/services/user.service';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { ToastrService } from 'ngx-toastr';

declare var $: any;
declare var bootstrap: any; // important si tu utilises Bootstrap JS via CDN ou installé via npm
registerLocaleData(localeFr, 'fr')
@Component({
  selector: 'app-detail-inventaires',
  templateUrl: './detail-inventaires.component.html',
  styleUrls: ['./detail-inventaires.component.scss'],
})
export class DetailInventairesComponent implements OnInit {
  inventaire: any;
  produits: any;
  listeFamilles: any;
  produitsInventaire: any[] = [];

  ligneInventaire: any[] = [];

  isDisable: boolean = false;
  isClick: boolean = false;

  isDisableTerminer: boolean = false;
  isClickTerminer: boolean = false;

  searchSelect = '';
  selectedProduit: any = null;
  showDropdown = false;

  isAllChecked: boolean = false;

  firstRoleName: string | null = null; // Contiendra le premier nom de rôle

  constructor(public router: Router, public userService: UserService,
    public toastrService: ToastrService, public inventaireService: InventaireService,
    public produitService: ProduitService) { }

  ngOnInit(): void {
    this.refreshRoleAndPermissonsUser();
    // Vérifier si les rôles existent dans l'utilisateur
    if (this.userService.user.roles && this.userService.user.roles.length > 0) {
      // Extraire le nom du premier rôle
      this.firstRoleName = this.userService.user.roles[0].name;
    }
    const detailInventaire = localStorage.getItem('detailInventaire');
    if (detailInventaire) {
      this.inventaire = JSON.parse(detailInventaire);
      if (localStorage.getItem('produitsInventaire') != null) {
        this.produitsInventaire = JSON.parse(localStorage.getItem('produitsInventaire')!);
      } else {
        this.produitsInventaire = this.inventaire.lignes;
      };
      if (localStorage.getItem('isAllChecked') != null) {
        this.isAllChecked = localStorage.getItem('isAllChecked') === 'true';
      };
    } else {
      this.router.navigate(['/inventaires']);
    }

    if (localStorage.getItem('listeProduitInventaire') != null) {
      this.produits = JSON.parse(localStorage.getItem('listeProduitInventaire')!);
      console.log(this.produits);
    };

    if (localStorage.getItem('listeFamillesInventaire') != null) {
      // Récupère les données depuis localStorage, ou un tableau vide si aucune donnée
      this.listeFamilles = JSON.parse(localStorage.getItem('listeFamillesInventaire') || '[]');
    };

    this.calculeTotalReel();
  }

  refreshRoleAndPermissonsUser(): void {
    this.userService.refreshRoleAndPermissonsUser(this.userService.user.id).subscribe(data => {
      let resp: any = data;
      this.userService.user.permissions = resp.user.permissions;
      this.userService.setRoles(resp.user.roles);
    });
  }


  get filtre() {
    return this.produits.filter((produit: any) =>
      produit.designation.toLowerCase().includes(this.searchSelect.toLowerCase())
    );
  }


  selectProduit(produit: any) {
    // Vérifier si le produit est déjà dans l'inventaire
    const produitExiste = this.produitsInventaire.some(p => p.code === produit.code);

    if (produitExiste) {
      this.toastrService.warning('Ce produit est déjà pris !');
      return;
    }

    this.isAllChecked = false;
    localStorage.removeItem('isAllChecked');
    this.selectedProduit = produit;
    this.searchSelect = '';
    this.showDropdown = false; // Fermer le dropdown après la sélection

    // Ajouter le produit à l'inventaire

    if (this.inventaire.site == 'Dépot') {
      produit.qty = produit.stock;
    }

    produit.stock_physique = 0;
    produit.ecart = 0;
    produit.total = produit.qty * produit.prix_achat;
    produit.total_reel = produit.stock_physique * produit.prix_achat;
    this.produitsInventaire.push(produit);

    // Mettre à jour le localStorage
    localStorage.removeItem('produitsInventaire');
    localStorage.setItem('produitsInventaire', JSON.stringify(this.produitsInventaire));
    this.calculeTotalReel();
  }


  // Fonction pour gérer le changement de famille sélectionnée
  selectFamille(event: any): void {
    this.isAllChecked = false;
    localStorage.removeItem('isAllChecked');
    const familleSelectionnee = event.target.value;
    if (familleSelectionnee == null) {
      localStorage.removeItem('produitsInventaire');
      this.produitsInventaire = [];
      this.calculeTotalReel();
    } else {
      localStorage.removeItem('produitsInventaire');
      this.produitsInventaire = [];

      // Filtrer les produits qui appartiennent à la famille sélectionnée
      const produitsSelectionnes = this.produits
        .filter((produit: any) => produit.famille === familleSelectionnee);

      // Mettre à jour ou initialiser les propriétés "stock_physique" et "ecart" pour chaque produit
      produitsSelectionnes.forEach((produit: any) => {
        if (this.inventaire.site == 'Dépot') {
          produit.qty = produit.stock;
        }
        produit.stock_physique = 0; // Initialiser la quantité saisie à 0
        produit.ecart = 0; // Initialiser l'écart à 0
        produit.total = produit.qty * produit.prix_achat;
        produit.total_reel = produit.stock_physique * produit.prix_achat;
      });

      // Ajouter les nouveaux produits à l'inventaire
      this.produitsInventaire = [...this.produitsInventaire, ...produitsSelectionnes];

      localStorage.removeItem('produitsInventaire');
      localStorage.setItem('produitsInventaire', JSON.stringify(this.produitsInventaire));
      this.calculeTotalReel();
    }

  }

  selectAllProduit(event: any) {
    if (event.target.checked) {
      this.isAllChecked = true;
      localStorage.setItem('isAllChecked', this.isAllChecked.toString());
      localStorage.removeItem('produitsInventaire');
      this.produitsInventaire = [];
      // Mettre à jour ou initialiser les propriétés "stock_physique" et "ecart" pour chaque produit
      this.produits.forEach((produit: any) => {
        if (this.inventaire.site == 'Dépot') {
          produit.qty = produit.stock;
        }
        produit.stock_physique = 0; // Initialiser la quantité saisie à 0
        produit.ecart = 0; // Initialiser l'écart à 0
        produit.total = produit.qty * produit.prix_achat;
        produit.total_reel = produit.stock_physique * produit.prix_achat;
      });

      // Fusionner tous les produits récupérés avec l'inventaire existant
      this.produitsInventaire = [...this.produitsInventaire, ...this.produits];

      localStorage.removeItem('produitsInventaire');
      localStorage.setItem('produitsInventaire', JSON.stringify(this.produitsInventaire));
      this.calculeTotalReel();
    } else {
      this.isAllChecked = false
      localStorage.removeItem('isAllChecked');
      localStorage.removeItem('produitsInventaire');
      this.produitsInventaire = [];
      this.calculeTotalReel();
    }

  }


  // fonction pour calculer la quantité différente
  calculerQuantiteDifferent(produit: any) {
    if (produit.stock_physique && produit.stock_physique > 0) {
      produit.ecart = produit.stock_physique - produit.qty;
      produit.total_reel = produit.stock_physique * produit.prix_achat;
      localStorage.removeItem('produitsInventaire')
      localStorage.setItem('produitsInventaire', JSON.stringify(this.produitsInventaire));
      this.calculeTotalReel();
    } else {
      produit.ecart = 0;
      localStorage.removeItem('produitsInventaire')
      localStorage.setItem('produitsInventaire', JSON.stringify(this.produitsInventaire));
    }
  }

  calculeTotalReel() {
    this.inventaire.total = this.produitsInventaire.reduce((sum, produit) => sum + (produit.total || 0), 0);
    this.inventaire.acquisition = this.produitsInventaire.reduce((sum, produit) => sum + (produit.total_reel || 0), 0);
    this.inventaire.benefice = this.inventaire.acquisition - (this.inventaire.credit - this.inventaire.dette);
  }


  // fonction pour calculer la quantité différente
  keyRemarque() {
    localStorage.removeItem('produitsInventaire')
    localStorage.setItem('produitsInventaire', JSON.stringify(this.produitsInventaire));
  }


  // Méthode pour supprimer un produit
  remove(produit: any): void {
    const index = this.produitsInventaire.indexOf(produit);
    if (index > -1) {
      this.produitsInventaire.splice(index, 1);
      localStorage.removeItem('produitsInventaire')
      localStorage.setItem('produitsInventaire', JSON.stringify(this.produitsInventaire));
      this.calculeTotalReel();
    }
  }

  onSubmit() {
    this.isDisable = true;
    this.isClick = true;
    const payload = {
      inventaire_id: this.inventaire.id,
      name: this.inventaire.name,
      site: this.inventaire.site,
      credit: this.inventaire.credit,
      dette: this.inventaire.dette,
      acquisition: this.inventaire.acquisition,
      benefice: this.inventaire.benefice,
      ligneInventaire: this.produitsInventaire,
      auteur: this.userService.name,
    };
    this.inventaireService.update(payload, this.inventaire.id).subscribe(data => {
      let resp: any = data;
      localStorage.removeItem('detailInventaire');
      this.inventaire = resp.inventaire;
      localStorage.setItem('detailInventaire', JSON.stringify(this.inventaire));
      this.isDisable = false;
      this.isClick = false;
      this.toastrService.success('Inventaire mis à jour avec succès !');
    });
  }

  onTerminer() {
    this.isDisableTerminer = true;
    this.isClickTerminer = true;
    this.isDisable = true;
    this.isClick = true;
    const payload = {
      inventaire_id: this.inventaire.id,
      auteur: this.userService.name,
    };
    this.inventaireService.terminer(payload, this.inventaire.id).subscribe(data => {
      let resp: any = data;
      localStorage.removeItem('detailInventaire');
      this.inventaire = resp.inventaire;
      localStorage.setItem('detailInventaire', JSON.stringify(this.inventaire));
      this.isDisableTerminer = false;
      this.isClickTerminer = false;
      this.toastrService.success('Inventaire Terminer avec succès !');
    });
  }


} 
