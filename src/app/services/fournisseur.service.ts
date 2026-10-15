import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class FournisseurService {

  private url = "https://www.kasse-boutique.com/server/public/api";

  private fournisseurs = `${this.url}/fournisseur/fournisseurs`;
  private fournisseur = `${this.url}/fournisseur/fournisseur`;
  private updatedInfo = `${this.url}/fournisseur/updateInfo`;
  private codeFournisseur = `${this.url}/fournisseur/fournisseur/code`;
  private created = `${this.url}/fournisseur/create`;
  private updated = `${this.url}/fournisseur/update`;
  private createJustify = `${this.url}/fournisseur/createJustify`;
  private updateJustify = `${this.url}/fournisseur/updateJustify`;
  private getJustify = `${this.url}/fournisseur/getJustify`;
  private getJustifyByFn = `${this.url}/fournisseur/getJustifyByFn`;
  private searchJustifyAchat = `${this.url}/fournisseur/justify/search`;
  private getAllJustifies = `${this.url}/fournisseur/justifys`;
  private justifysToDay = `${this.url}/fournisseur/justifysToDay`;
  private creatCpt = `${this.url}/fournisseur/createCompte`;
  private image = `${this.url}/fournisseur/image`;
  private deleted = `${this.url}/fournisseur/delete`;
  private search = `${this.url}/fournisseur/search`;
  private achat = `${this.url}/fournisseur/achatsFournisseur`;
  private lignesNonSoldees = `${this.url}/fournisseur`;

  listFournisseur!: any[];
  public dataForm!: FormGroup;

  constructor(private http: HttpClient, public router: Router) { }

  getAll(): Observable<any> {
    return this.http.get(`${this.fournisseurs}`);
  }

  getData(id: number): Observable<Object> {
    return this.http.get(`${this.fournisseur}/${id}`);
  }

  getFournisseurByCode(code: string): Observable<Object> {
    return this.http.get(`${this.codeFournisseur}/${code}`);
  }

  createData(data: Object): Observable<Object> {
    return this.http.post(`${this.created}`, data);
  }

  onPrint(): Observable<any> {
    return this.http.get(`https://www.kasse-boutique.com/server/public/api/print`);
  }

  updateData(data: Object): Observable<Object> {
    return this.http.post(`${this.updated}`, data);
  }

  createCompte(data: Object): Observable<Object> {
    return this.http.post(`${this.creatCpt}`, data);
  }

  updateImage(formData: FormData): Observable<any> {
    return this.http.post(`${this.image}`, formData);
  }

  deleteData(id: number): Observable<any> {
    return this.http.get(`${this.deleted}/${id}`, { responseType: 'text' });
  }

  searchFournisseur(search: any): Observable<Object> {
    return this.http.get(`${this.search}/${search}`);
  }

  getAchatFournisseur(code: any): Observable<any> {
    return this.http.get(`${this.achat}/${code}`);
  }

  getLignesNonSoldees(code: string): Observable<any> {
    return this.http.get(`${this.lignesNonSoldees}/${code}/ligne-achats-restants`);
  }

  saveLignes(data: Object): Observable<Object> {
    return this.http.post(`${this.createJustify}`, data);
  }

  editLignes(data: Object): Observable<Object> {
    return this.http.post(`${this.updateJustify}`, data);
  }

  getAllJustify(): Observable<any> {
    return this.http.get(`${this.getAllJustifies}`);
  }

  getJustifyToDay(): Observable<any> {
    return this.http.get(`${this.justifysToDay}`);
  }

  getJustifyAchat(id: number): Observable<Object> {
    return this.http.get(`${this.getJustify}/${id}`);
  }

  searchJustify(search: any): Observable<any> {
    return this.http.get(`${this.searchJustifyAchat}/${search}`);
  }

  getJustifyByFournisseur(code: string): Observable<Object> {
    return this.http.get(`${this.getJustifyByFn}/${code}`);
  }

  sendJustifyAchatWhatsApp(id: number) {
    return this.http.get(`https://www.kasse-boutique.com/server/public/send/justify/whatsapp/${id}`);
  }

  updateInfo(data: Object): Observable<Object> {
    return this.http.post(`${this.updatedInfo}`, data);
  }

  deleteJustify(id: number): Observable<any> {
    return this.http.get(`${this.deleted}/justify/${id}`, { responseType: 'text' });
  }

  editJustify(justifyAchat: any) {
    this.getJustifyAchat(justifyAchat.id).subscribe((data) => {
      let response: any = data;
      localStorage.removeItem('justifyAchat');
      localStorage.removeItem('listLigneJustifyAchat');
      localStorage.removeItem('listLigneJustifyAchatDetail');
      localStorage.setItem('justifyAchat', JSON.stringify(response.justifyAchat));
      localStorage.setItem('listLigneJustifyAchat', JSON.stringify(response.justifyLigneAchats));
      this.router.navigate(['/edit-justification-achat']);
    });
  }

  detailJustify(justifyAchat: any) {
    this.getJustifyAchat(justifyAchat.id).subscribe((data) => {
      let response: any = data;
      localStorage.removeItem('justifyAchat');
      localStorage.removeItem('listLigneJustifyAchat');
      localStorage.removeItem('listLigneJustifyAchatDetail');
      localStorage.setItem('justifyAchat', JSON.stringify(response.justifyAchat));
      localStorage.setItem('listLigneJustifyAchatDetail', JSON.stringify(response.justifyLigneAchats));
      this.router.navigate(['/detail-justification-achat']);
    });
  }
}
