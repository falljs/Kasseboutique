import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FournisseurService } from 'src/app/services/fournisseur.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { UserService } from 'src/app/services/user.service';
declare var $: any;

@Component({
  selector: 'app-list-justification',
  templateUrl: './list-justification.component.html',
  styleUrls: ['./list-justification.component.scss']
})
export class ListJustificationComponent {

  page: number = 1;
  nbrJustify: number = 0;
  defaultItem: number = 100;
  nbrPage: number = 0;
  date: any;
  fournisseurs!: any[];
  justifyAchats!: any[];

  searchSelect = '';
  selectedFournisseur: any = null;
  showDropdown = false;

  isDisable = false;
  isClick = false;

  firstRoleName: string | null = null; // Contiendra le premier nom de rôle

  constructor(public fournisseurService: FournisseurService, private datePipe: DatePipe,
    public userService: UserService, public localStorageService: LocalStorageService, public router: Router,) { }

  ngOnInit() {
    this.date = this.datePipe.transform(new Date(Date.now()), 'dd-MM-yyyy');
    this.getJustifyToDay();
    this.getFournisseurs();
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

  getJustifyToDay() {
    this.fournisseurService.getJustifyToDay().subscribe((data) => {
      let resp: any = data;
      this.justifyAchats = resp.justifyAchats;
    });
  }

  getAllJustify() {
    this.fournisseurService.getAllJustify().subscribe((data) => {
      let resp: any = data;
      this.justifyAchats = resp.justifyAchats;
    });
  }

  get filteredFournisseur() {
    return this.fournisseurs.filter(fournisseur =>
      fournisseur.name.toLowerCase().includes(this.searchSelect.toLowerCase())
    );
  }

  selectFournisseur(fournisseur: any) {
    this.selectedFournisseur = fournisseur;
    this.searchSelect = '';
    this.showDropdown = false; // Fermer le dropdown après la sélection
    if (fournisseur) {
      this.fournisseurService.getJustifyByFournisseur(fournisseur.code).subscribe(
        (data) => {
          let respopnse: any = data;
          this.justifyAchats = respopnse;
          this.nbrJustify = this.justifyAchats.length;
          this.nbrPage = Math.ceil(this.nbrJustify / this.defaultItem);
        });
    }
    else {
      this.getJustifyToDay();
    }
  }

  //Get All product fournisseurs!:any[];
  getFournisseurs() {
    this.fournisseurService.getAll().subscribe((res: any[]) => {
      this.fournisseurs = res;
    });
  }

  search() {
    let search: any = $("#inputSearch").val();
    if (search) {
      this.fournisseurService.searchJustify(search).subscribe(
        data => {
          let respopnse: any = data;
          this.justifyAchats = respopnse;
        });
    } else {
      this.getJustifyToDay();
    }
  }

  edit(jstifyAchat: any) {
    this.fournisseurService.editJustify(jstifyAchat);
  }

  detail(jstifyAchat: any) {
    this.fournisseurService.detailJustify(jstifyAchat);
  }
}
