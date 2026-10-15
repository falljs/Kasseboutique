import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ParametreService } from 'src/app/services/parametre.service';
import { DatePipe } from '@angular/common';
import { AchatService } from 'src/app/services/achat.service';
import { FournisseurService } from 'src/app/services/fournisseur.service';

@Component({
  selector: 'app-add-recu',
  templateUrl: './add-recu.component.html',
  styleUrls: ['./add-recu.component.scss']
})
export class JustificationAchatComponent implements OnInit {

  formAchat!: FormGroup;

  date_achat: any;
  numero_bl: any;
  info_chauffeur: any;
  transport: any;
  paiement: any;
  remarque: any;

  searchSelect = '';
  selectedFournisseur: any = null;
  showDropdown = false;

  fournisseurs!: any[];
  ligneNoSoldees: any[] = [];

  isDisable: boolean = false;
  isClick: boolean = false;

  firstRoleName: string | null = null; // Contiendra le premier nom de rôle

  constructor(public router: Router, public fournisseurService: FournisseurService,
    public fb: FormBuilder, public userService: UserService,
    public toastrService: ToastrService, public parametreService: ParametreService,
    public achatService: AchatService, private datePipe: DatePipe,) { }

  ngOnInit() {
    this.getFournisseurs();
    this.userService.getUserLoggin();
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

  get filteredFournisseur() {
    return this.fournisseurs.filter(fournisseur =>
      fournisseur.name.toLowerCase() !== 'Néant' && // exclure "Néant"
      fournisseur.name.toLowerCase().includes(this.searchSelect.toLowerCase())
    );
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

  getLignesNonSoldees(code: any) {
    this.fournisseurService.getLignesNonSoldees(code).subscribe((res: any[]) => {
      console.log(res)
      let data: any = res;
      this.ligneNoSoldees = data.lignes;
    });
  }

  selectFournisseur(fournisseur: any) {
    this.selectedFournisseur = fournisseur;
    this.searchSelect = '';
    this.showDropdown = false; // Fermer le dropdown après la sélection
    if (fournisseur.name != 'Néant') {
      this.getLignesNonSoldees(fournisseur.code);
    }
  }

  saveLignes() {
    this.isDisable = true; this.isClick = true;
    if (!this.selectedFournisseur) {
      this.toastrService.error('Veuillez sélectionner un fournisseur');
      this.isDisable = false; this.isClick = false;
      return;
    }

    const payload = {
      code_fn: this.selectedFournisseur.code,
      numero_bl: this.numero_bl,
      info_chauffeur: this.info_chauffeur,
      paiement: this.paiement,
      transport: this.transport,
      remarque: this.remarque,
      auteur: this.userService.name,
      lignes: this.ligneNoSoldees
        .filter(l => l.checked) // 👈 on garde seulement les lignes cochées
        .map(l => ({
          id: l.id,
          date_saisie: l.dateSaisie
        }))
    };

    if (payload.lignes.length === 0) {
      this.toastrService.warning('Veuillez cocher au moins une ligne');
      this.isDisable = false; this.isClick = false;
      return;
    }

    // Vérifie si une ligne cochée n'a pas de date saisie
    const ligneSansDate = payload.lignes.some(l => !l.date_saisie);

    if (ligneSansDate) {
      this.toastrService.warning('Veuillez saisir une date pour toutes les lignes cochées');
      this.isDisable = false; this.isClick = false;
      return;
    }

    this.fournisseurService.saveLignes(payload).subscribe({
      next: (data) => {
        let resp: any = data;
        this.toastrService.success('Lignes enregistrées avec succès !');
        this.isDisable = false; this.isClick = false;
        this.fournisseurService.detailJustify(resp.justifyAchat);
      },
      error: (err) => {
        this.toastrService.error('Erreur lors de l\'enregistrement');
        this.isDisable = false; this.isClick = false;
        console.error(err);
      }
    });
  }

}
