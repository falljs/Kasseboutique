import { DatePipe, registerLocaleData } from '@angular/common';
import { Component, LOCALE_ID, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import localeFr from '@angular/common/locales/fr';
import { ToastrService } from 'ngx-toastr';
import { Produit } from 'src/app/models/produit';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { ParametreService } from 'src/app/services/parametre.service';
import { ProduitService } from 'src/app/services/produit.service';
import { UserService } from 'src/app/services/user.service';
import { FournisseurService } from 'src/app/services/fournisseur.service';
import { Router } from '@angular/router';
import { LocalStorageService } from 'src/app/services/local-storage.service';
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
declare var $: any;
declare var bootstrap: any; // important si tu utilises Bootstrap JS via CDN ou installé via npm
registerLocaleData(localeFr, 'fr')
@Component({
  selector: 'app-produit',
  templateUrl: './produit.component.html',
  styleUrls: ['./produit.component.scss'],
  providers: [{ provide: LOCALE_ID, useValue: 'fr' }]
})
export class ProduitComponent implements OnInit {

  page: number = 1;
  nbrProduit: number = 0;
  defaultItem: number = 50;
  currentPage: number = 1; // Page actuelle

  produits!: Produit[];
  categories!: [];
  form!: FormGroup;
  formUp!: FormGroup;
  formFournisseur!: FormGroup;
  id_Produit!: any;
  nbrPage: number = 0;
  totalQty: number = 0;
  totalPrix: number = 0;
  totalPrixGlobal: number = 0;
  totalPrixVente: number = 0;

  printQty: boolean = false;
  printCat: boolean = false;

  cat!: any;
  qty!: any;
  qtyStock!: any;

  fournisseurs!: any[];
  isChecked: boolean = false; // Initialisation de la propriété isChecked à false

  produitDetail: any;

  searchSelect = '';
  selectedFournisseur: any = null;
  showDropdown = false;

  newFournisseur!: any;
  newInputFn!: boolean;

  searchSelectUp = '';
  selectedFournisseurUp: any = null;
  showDropdownUp = false;

  upFournisseur!: any;
  upInputFn!: boolean;

  isLoading: boolean = false;
  isDisable: boolean = false;

  // ms erreur
  msg_designation: any;

  date!: any;
  heure!: any;

  file!: any;

  firstRoleName: string | null = null; // Contiendra le premier nom de rôle

  constructor(private produitService: ProduitService, public userService: UserService,
    public fb: FormBuilder, public toastrService: ToastrService,
    public fournisseurService: FournisseurService, public router: Router,
    public localStorageService: LocalStorageService,
    public parametreService: ParametreService, private datePipe: DatePipe) { }

  ngOnInit(): void {
    this.printCat = true;
    this.printQty = false;
    this.getProducts();
    this.initForm();
    this.initFormUp();
    this.initFormFournisseur();
    this.getSetting();
    this.getAllCategories();
    this.getFournisseurs();
    this.date = this.getDate(new Date(Date.now()));
    this.heure = this.getHeure(new Date(Date.now()));
    this.refreshRoleAndPermissonsUser();
    // Vérifier si les rôles existent dans l'utilisateur
    if (this.userService.user.roles && this.userService.user.roles.length > 0) {
      // Extraire le nom du premier rôle
      this.firstRoleName = this.userService.user.roles[0].name;
    }
  }

  refreshRoleAndPermissonsUser(): void {
    this.userService.refreshRoleAndPermissonsUser(this.userService.user.id).subscribe(data => {
      let resp: any = data;
      this.userService.user.permissions = resp.user.permissions;
      this.userService.setRoles(resp.user.roles);
    });
  }

  getDate(date: any) {
    return this.datePipe.transform(date, 'dd-MM-yyyy');
  }
  getHeure(date: any) {
    return this.datePipe.transform(date, 'HH:mm:ss');
  }

  onCheckboxChange() {
    this.isChecked = true;
    localStorage.setItem('qty', JSON.stringify(this.qtyStock));
  }

  unCheckboxChange() {
    this.isChecked = false;
    $("#qty").val(this.qtyStock);
    this.f['entrepot_1'].setValue(0);
  }

  showInputFn() {
    this.newInputFn = true;
    this.newFournisseur = '';
  }

  hideInputFn() {
    this.newInputFn = false;
    this.newFournisseur = '';
  }

  showInputFnUp() {
    this.upInputFn = true;
    this.upFournisseur = '';
  }

  hideInputFnUp() {
    this.upInputFn = false;
    this.upFournisseur = '';
  }

  get filteredFournisseur() {
    return this.fournisseurs.filter(fournisseur =>
      fournisseur.name.toLowerCase().includes(this.searchSelect.toLowerCase())
    );
  }

  selectFournisseur(fournisseur: any) {
    this.selectedFournisseur = fournisseur;
    this.form.value.code_fn = fournisseur.code;
    this.searchSelect = '';
    this.showDropdown = false; // Fermer le dropdown après la sélection
  }

  get filteredFournisseurUp() {
    return this.fournisseurs.filter(fournisseur =>
      fournisseur.name.toLowerCase().includes(this.searchSelectUp.toLowerCase())
    );
  }

  selectFournisseurUp(fournisseur: any) {
    this.selectedFournisseurUp = fournisseur;
    this.formUp.value.code_fn = fournisseur.code;
    this.searchSelectUp = '';
    this.showDropdownUp = false; // Fermer le dropdown après la sélection
  }

  //Get All product
  getProducts() {
    this.cat = '';
    this.qty = '';
    this.produitService.getAllProduct().subscribe(res => {
      this.produits = res;
      this.nbrProduit = this.produits.length;
      this.nbrPage = Math.ceil(this.nbrProduit / this.defaultItem);
      this.totalQty = 0;
      this.totalPrix = 0;
      this.totalPrixGlobal = 0;
      this.totalPrixVente = 0;

      for (var i = 0; i < this.produits.length; i++) {
        if (this.produits[i].qty) {
          this.totalQty += this.produits[i].qty;
        } else {
          this.totalQty += this.produits[i].qty;
        }

        if (this.produits[i].prix_achat) {
          // Use prix_achat for totalPrix calculation
          this.totalPrix += this.produits[i].prix_achat;

          this.totalPrixVente += this.produits[i].prix;

          this.totalPrixGlobal += this.produits[i].prix_achat * this.produits[i].qty;
        }
      }
    });
  }

  getAllCategories() {
    this.produitService.getAllCategories().subscribe(res => {
      this.categories = res;
    });
  }

  search() {
    this.page = 1;
    let search: any = $("#inputDesignation").val();
    if (search) {
      this.produitService.searchProduit(search).subscribe(
        res => {
          let data: any = res;
          this.produits = data;
          this.nbrProduit = this.produits.length;
        });
    } else {
      this.getProducts();
    }
  }

  inputFn() {
    let input: any = $("#newFournisseur").val();
    if (input) {
      this.newFournisseur = input;
    } else {
      this.newFournisseur = '';
    }
  }

  inputFnUp() {
    let input: any = $("#upFournisseur").val();
    if (input) {
      this.upFournisseur = input;
    } else {
      this.upFournisseur = '';
    }
  }

  keyupStock() {
    localStorage.removeItem('qty');
    localStorage.setItem('qty', JSON.stringify($("#qty").val()));
    this.qtyStock = JSON.parse(localStorage.getItem('qty')!);
  }

  keyupDepot() {
    const qtyDepot = +$("#entrepot_1").val(); // Le "+" convertit en nombre
    const qtyStock = this.qtyStock;

    if (qtyDepot > qtyStock) {
      this.toastrService.error('La quantité en stock ne doit pas être inférieure à la quantité en dépôt !');
      $("#entrepot_1").val(''); // Optionnel : reset si erreur
      $("#qty").val(qtyStock); // Rétablir la valeur du stock initial
      return;
    }

    const newQty = qtyStock - qtyDepot;
    $("#qty").val(newQty);
  }


  OnChangeCategory(ctrl: any) {
    if (ctrl.value) {
      this.printCat = true;
      this.printQty = false;
      this.cat = ctrl.value;
      this.produitService.getProductByCategory(ctrl.value).subscribe(res => {
        let data: any = res;
        this.produits = data;
        this.nbrProduit = this.produits.length;
        this.nbrPage = Math.ceil(this.nbrProduit / this.defaultItem);
        this.totalQty = 0; this.totalPrix = 0; this.totalPrixGlobal = 0; this.totalPrixVente = 0;

        for (var i = 0; i < this.produits.length; i++) {
          if (this.produits[i].qty) {
            this.totalQty += this.produits[i].qty;
          } else {
            this.totalQty += this.produits[i].qty;
          }

          if (this.produits[i].prix_achat) {
            // Use prix_achat for totalPrix calculation
            this.totalPrix += this.produits[i].prix_achat;
            this.totalPrixVente += this.produits[i].prix;

            this.totalPrixGlobal += this.produits[i].prix_achat * this.produits[i].qty;
          }
        }
      });
    } else {
      this.printCat = true;
      this.printQty = false;
      this.cat = '';
      this.qty = '';
      this.getProducts();
    }
  }

  selectedFn(ctrl: any) { }

  OnChangeQty(ctrl: any) {
    if (ctrl.value) {
      this.printQty = true;
      this.printCat = false;
      this.qty = ctrl.value;
      if (this.qty == 'qtyOn') {
        this.produitService.getProductByQtyOn().subscribe(res => {
          let data: any = res;
          this.produits = data;
          this.nbrProduit = this.produits.length;
          this.nbrPage = Math.ceil(this.nbrProduit / this.defaultItem);
          this.totalQty = 0; this.totalPrix = 0; this.totalPrixGlobal = 0; this.totalPrixVente = 0;
          for (var i = 0; i < this.produits.length; i++) {
            if (this.produits[i].qty) {
              this.totalQty += this.produits[i].qty;
            } else {
              this.totalQty += this.produits[i].qty;
            }

            if (this.produits[i].prix_achat) {
              // Use prix_achat for totalPrix calculation
              this.totalPrix += this.produits[i].prix_achat;
              this.totalPrixVente += this.produits[i].prix;

              this.totalPrixGlobal += this.produits[i].prix_achat * this.produits[i].qty;
            }
          }
        });
      } else if (this.qty == 'qtyAlert') {
        this.produitService.getProductByQtyAlert().subscribe(res => {
          let data: any = res;
          this.produits = data;
          this.nbrProduit = this.produits.length;
          this.nbrPage = Math.ceil(this.nbrProduit / this.defaultItem);
          this.totalQty = 0; this.totalPrix = 0; this.totalPrixGlobal = 0; this.totalPrixVente = 0;
          for (var i = 0; i < this.produits.length; i++) {
            if (this.produits[i].qty) {
              this.totalQty += this.produits[i].qty;
            } else {
              this.totalQty += this.produits[i].qty;
            }

            if (this.produits[i].prix_achat) {
              // Use prix_achat for totalPrix calculation
              this.totalPrix += this.produits[i].prix_achat;
              this.totalPrixVente += this.produits[i].prix;

              this.totalPrixGlobal += this.produits[i].prix_achat * this.produits[i].qty;
            }
          }
        });

      } else {
        this.produitService.getProductByQtyOff().subscribe(res => {
          let data: any = res;
          this.produits = data;
          this.nbrProduit = this.produits.length;
          this.nbrPage = Math.ceil(this.nbrProduit / this.defaultItem);
          this.totalQty = 0; this.totalPrix = 0; this.totalPrixGlobal = 0; this.totalPrixVente = 0;
          for (var i = 0; i < this.produits.length; i++) {
            if (this.produits[i].qty) {
              this.totalQty += this.produits[i].qty;
            } else {
              this.totalQty += this.produits[i].qty;
            }

            if (this.produits[i].prix_achat) {
              // Use prix_achat for totalPrix calculation
              this.totalPrix += this.produits[i].prix_achat;
              this.totalPrixVente += this.produits[i].prix;

              this.totalPrixGlobal += this.produits[i].prix_achat * this.produits[i].qty;
            }
          }
        });
      }

    } else {
      this.printCat = true;
      this.printQty = false;
      this.qty = '';
      this.cat = '';
      this.getProducts();
    }
  }

  getSetting() {
    this.parametreService.getSetting().subscribe((data) => {
      localStorage.setItem('setting', JSON.stringify(data));
    });
  }

  //Created product
  onSubmit() {
    this.isDisable = true;
    this.form.value.auteur = this.userService.name;
    this.form.value.qty = this.form.value.qty - this.form.value.entrepot_1;
    this.produitService.createProduit(this.form.value).subscribe(
      response => {
        let produit: any = response;
        this.isDisable = false;
        if (produit.msg_designation) {
          this.msg_designation = produit.msg_designation;
        } else {
          this.getProducts();
          this.getFournisseurs();
          this.localStorageService.clearExecptException();
          this.form.reset();
          this.initForm();
          this.toastrService.success('Produit ' + produit.designation + ' Ajouté !');
        }
      });
  }

  //export product
  export() {
    this.produitService.exportAllProduct().subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'produits_export ' + this.date + ' ' + this.heure + '.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.file = file;
  }

  onSendFile() {
    this.isLoading = true;
    if (this.file) {
      this.produitService.importProduit(this.file).subscribe({
        next: res => {
          this.toastrService.success('Importation réussie avec succes !');
          $('#import-product').modal('toggle');
          this.getProducts();
          this.isLoading = false;
        },
        error: err => console.error('Erreur', err)
      });
    } else {
      this.isLoading = false;
    }
  }


  onSubmitFournisseur() {
    this.formFournisseur.value.name = this.newFournisseur;
    this.formFournisseur.value.auteur = this.userService.name;
    this.fournisseurService.createData(this.formFournisseur.value).subscribe({
      next: (data: any) => {
        let resp: any = data;
        this.initFormFournisseur();
        this.hideInputFn();
        this.toastrService.success('Fournisseur ' + resp.data.name + ' Ajouté !');
        this.fournisseurService.getAll().subscribe(
          response => {
            this.fournisseurs = response;
          });
        this.selectFournisseur(resp.data);
      },
      error: (err: { error: { message: any; }; }) => {
        console.log(err.error.message);
      }
    });
  }

  onSubmitFournisseurUp() {
    this.formFournisseur.value.name = this.upFournisseur;
    this.formFournisseur.value.auteur = this.userService.name;
    this.fournisseurService.createData(this.formFournisseur.value).subscribe({
      next: (data: any) => {
        let resp: any = data;
        this.initFormFournisseur();
        this.hideInputFnUp();
        this.toastrService.success('Fournisseur ' + resp.data.name + ' Ajouté !');
        this.fournisseurService.getAll().subscribe(
          response => {
            this.fournisseurs = response;
          });
        this.selectFournisseurUp(resp.data);
      },
      error: (err: { error: { message: any; }; }) => {
        console.log(err.error.message);
      }
    });
  }

  //init form created data
  initForm() {
    this.form = new FormGroup({
      designation: new FormControl('', [Validators.required, Validators.minLength(2)]),
      qty: new FormControl(0, [Validators.required]),
      qtyAlert: new FormControl(0),
      prix: new FormControl(0, [Validators.required]),
      prix_achat: new FormControl(0, [Validators.required, Validators.min(10)]),
      prix_gros: new FormControl(0),
      prix_carton: new FormControl(0),
      prix_douzaine: new FormControl(0),
      ref: new FormControl(''),
      code_barre: new FormControl(''),
      famille: new FormControl(''),
      marque: new FormControl(''),
      code_fn: new FormControl('Fn_1'),
      description: new FormControl(''),
      entrepot_1: new FormControl(0),
      auteur: new FormControl(this.userService.name)
    });
  }


  //init form updated data
  initFormUp() {
    this.formUp = new FormGroup({
      code: new FormControl(''),
      designation: new FormControl('', [Validators.required, Validators.minLength(2)]),
      qty: new FormControl(0),
      qtyAlert: new FormControl(0),
      prix: new FormControl(0),
      prix_achat: new FormControl(0),
      prix_gros: new FormControl(0),
      prix_carton: new FormControl(0),
      prix_douzaine: new FormControl(0),
      ref: new FormControl(''),
      code_barre: new FormControl(''),
      famille: new FormControl(''),
      marque: new FormControl(''),
      description: new FormControl(''),
      auteur: new FormControl(this.userService.name),
      code_fn: new FormControl(''),
      reduire: new FormControl(0),
    });
  }

  initFormFournisseur() {
    this.formFournisseur = new FormGroup({
      name: new FormControl('', [Validators.required]),
      auteur: new FormControl(this.userService.name)
    });
  }

  get f() {
    return this.form.controls;
  }
  get fUp() {
    return this.form.controls;
  }

  get fFournisseur() {
    return this.formFournisseur.controls
  }

  //Update
  update(p: any) {
    this.formUp = new FormGroup({
      id: new FormControl(p.id),
      code: new FormControl(p.code),
      designation: new FormControl(p.designation, [Validators.required]),
      qty: new FormControl(p.qty, [Validators.required]),
      qtyAlert: new FormControl(p.qtyAlert, [Validators.required]),
      prix: new FormControl(p.prix),
      prix_achat: new FormControl(p.prix_achat),
      prix_gros: new FormControl(p.prix_gros),
      prix_carton: new FormControl(p.prix_carton),
      prix_douzaine: new FormControl(p.prix_douzaine),
      ref: new FormControl(p.ref),
      code_barre: new FormControl(p.code_barre),
      famille: new FormControl(p.famille),
      marque: new FormControl(p.marque),
      description: new FormControl(p.description),
      auteur: new FormControl(this.userService.name),
      code_fn: new FormControl(p.code_fn),
      reduire: new FormControl(0),
    });
    if (p) {
      this.fournisseurService.getFournisseurByCode(p.code_fn).subscribe(
        data => {
          let resp: any = data;
          this.selectedFournisseurUp = resp.fournisseur;
          this.selectFournisseurUp(this.selectedFournisseurUp);
        });
    }
  }

  //methode detail
  detail(p: any) {
    if (this.userService.checkPermissionExistence(this.firstRoleName + ' detail produit Stock')) {
      this.produitDetail = p;

      setTimeout(() => {
        const offcanvasEl = document.getElementById('detailOffcanvasStart');
        if (offcanvasEl) {
          const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
          bsOffcanvas.show();

          // BONUS : Nettoyer automatiquement le contenu quand on ferme
          offcanvasEl.addEventListener('hidden.bs.offcanvas', () => {
            this.produitDetail = null; // optionnel
          });
        }
      });

      this.produitService.getProduit(p.id).subscribe((data: any) => {
        let resp: any = data;
        this.produitDetail = resp;
      });
    } else {
      this.toastrService.error("Vous n'avez pas l'authorisation d'acces !");
    }
  }

  //methode inventaire
  inventaire(produit: any) {
    localStorage.removeItem('produitInventaire')
    localStorage.setItem('produitInventaire', JSON.stringify(produit));
    this.router.navigate(['/inventaire']);
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


  onUpdate() {
    this.formUp.value.code_fn = this.selectedFournisseurUp.code;
    this.produitService.updateProduit(this.formUp.value).subscribe(res => {
      let produit: any = res;
      if (produit.msg_designation) {
        this.msg_designation = produit.msg_designation;
      } else {
        this.getProducts();
        this.form.reset();
        $('#modal-product-update').modal('toggle');
        this.toastrService.success('Produit modifié !');
      }

    });
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1; // Réinitialiser à la première page après modification
  }

  modalDeleteProduit(id: number) {
    this.id_Produit = id;
  }

  deleteProduit() {
    this.produitService.delete(this.id_Produit).subscribe((data) => {
      this.getProducts();
      this.toastrService.warning('Produit supprimé !');
    });
  }

  //Get All product fournisseurs!:any[];
  getFournisseurs() {
    this.fournisseurService.getAll().subscribe((res: any[]) => {
      this.fournisseurs = res;
      // filtre le client néant
      let listFournisseurs: any = this.fournisseurs.filter((fournisseur: any) => fournisseur.name == 'Néant');
      // Sélectionne le premier client par défaut
      if (listFournisseurs.length > 0) {
        this.selectedFournisseur = listFournisseurs[0];
        this.selectFournisseur(this.selectedFournisseur);
      }
    });
  }

  openFournisseur() {
    this.showInputFn();
  }

  openFournisseurUp() {
    this.showInputFnUp();
  }


  printCategorie() {
    this.produitService.onPrint().subscribe((data) => {
      //let response: any = data;
      window.open('https://www.kasse-boutique.com/server/public/print/produits/categorie/' + this.cat, "_blank");
    });
  }

  printQtyOn() {
    this.produitService.onPrint().subscribe((data) => {
      //let response: any = data;
      window.open('https://www.kasse-boutique.com/server/public/print/produits/qtyOn', "_blank");
    });
  }

  printQtyOff() {
    this.produitService.onPrint().subscribe((data) => {
      //let response: any = data;
      window.open('https://www.kasse-boutique.com/server/public/print/produits/qtyOff', "_blank");
    });
  }

  printQtyAlert() {
    this.produitService.onPrint().subscribe((data) => {
      //let response: any = data;
      window.open('https://www.kasse-boutique.com/server/public/print/produits/qtyAlert', "_blank");
    });
  }

  printProduit(commande: any) {
    this.produitService.onPrint().subscribe((data) => {
      //let response: any = data;
      window.open('https://www.kasse-boutique.com/server/public/print/produits/', "_blank");
    });
  }


  routeMouvement() {
    // Utilisation de la fonction clearLocalStorage
    const exceptions = ['user', 'token', 'payment'];
    this.localStorageService.clearLocalStorage(exceptions);
    this.router.navigate(['/mouvement-list']);
  }

  routeDepot_1() {
    // Utilisation de la fonction clearLocalStorage
    const exceptions = ['user', 'token', 'payment'];
    this.localStorageService.clearLocalStorage(exceptions);
    this.router.navigate(['/depot_I']);
  }

  routeDepot_2() {
    // Utilisation de la fonction clearLocalStorage
    const exceptions = ['user', 'token', 'payment'];
    this.localStorageService.clearLocalStorage(exceptions);
    this.router.navigate(['/depot_II']);
  }

}
