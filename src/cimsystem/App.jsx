"use client";
/* ============================================================
   CIMSYSTEM V2 — Application (maquette)
   ============================================================ */
import React,{useState,useMemo,useRef,useCallback,useEffect} from "react";
import {
  Search,Layers,LayoutDashboard,Table2,Inbox,X,MapPin,User,Users,Calendar,
  AlertTriangle,QrCode,FileText,Plus,Minus,Crosshair,Hash,Clock,Euro,ScrollText,
  Bell,ChevronRight,ChevronLeft,Map,Landmark,Hammer,RotateCcw,Settings,Receipt,
  CheckCircle2,Circle,Wrench,FileSignature,Image as ImageIcon,History,Building2,
  CalendarDays,Globe,Menu,Filter,Info,ListChecks,ZoomIn,ZoomOut,Maximize,Printer,
  Camera,Ruler,MousePointer2,SquarePen,LogOut,HelpCircle,Skull,ChevronDown,Save,Bookmark,
  ClipboardList,Play,Upload,Send,Share2,Video,Palette,PlusSquare,Eye,EyeOff,Folder,FolderOpen,FileCheck2,Stamp,
  Trash2,Ban,FilePlus,UserPlus,Star,Mail,Archive,Paperclip,
  LogIn,KeyRound,ShieldCheck,ToggleRight,ToggleLeft,UserCog,Download,Lock,
  Gavel,ShoppingCart,Heart,ExternalLink,
} from "lucide-react";
import L from "leaflet";
import { chargerConcessions, chargerDeliberations, envoyerDeliberation, chargerCommandesQR, envoyerCommandeQR, connexion, verifierMfa, envoyerConcession, envoyerDeclaration, majConcession, preparerMfa, confirmerMfa } from "./api.js";
import { jsPDF } from "jspdf";
import qrcodegen from "qrcode-generator";
import proj4 from "proj4";
proj4.defs("EPSG:31370","+proj=lcc +lat_1=51.16666723333333 +lat_2=49.8333339 +lat_0=90 +lon_0=4.367486666666666 +x_0=150000.013 +y_0=5400088.438 +ellps=intl +towgs84=-106.8686,52.2978,-103.7239,0.3366,-0.457,1.8422,-1.2747 +units=m +no_defs");
proj4.defs("EPSG:3812","+proj=lcc +lat_1=49.83333333333334 +lat_2=51.16666666666666 +lat_0=50.797815 +lon_0=4.359215833333333 +x_0=649328 +y_0=665262 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
import Papa from "papaparse";

// ============================================================
//  CIMSYSTEM V2 — données de démonstration
// ============================================================
const NATURES = {
  pleine_terre:{label:"Pleine terre",color:"#854B3D"},
  caveau:{label:"Caveau",color:"#7D7C83"},
  cavurne:{label:"Cavurne",color:"#FD6786"},
  columbarium:{label:"Columbarium",color:"#1D48CC"},
  dispersion:{label:"Aire de dispersion",color:"#2E971F"},
  sihl:{label:"SIHL — sép. historique",color:"#E6790A"},
  ossuaire:{label:"Ossuaire",color:"#4F5B62"},
  pelouse:{label:"Pelouse d'honneur",color:"#6B7A45"},
  etoiles:{label:"Parcelle des étoiles",color:"#8E7CC3"},
  terre_commune:{label:"Terre commune",color:"#A88E6A"},
};
const STATUTS = {
  libre:{label:"Libre",ring:"#94A3B8"},
  occupe:{label:"Octroyée",ring:"#334155"},
  echue:{label:"Échue",ring:"#C0392B"},
  renouvellement:{label:"En renouvellement",ring:"#E08E33"},
  reprise:{label:"En reprise",ring:"#7A271A"},
  archive:{label:"Archivée",ring:"#6D28D9"},
};
const CEMETERIES=[
  {id:"flaches",nom:"Flaches",commune:"Gerpinnes",coord:[50.339967,4.484227]},
  {id:"acoz",nom:"Acoz",commune:"Gerpinnes",coord:[50.358379,4.512296]},
  {id:"hymiee",nom:"Hymiée",commune:"Gerpinnes",coord:[50.32315,4.530522]},
  {id:"villers",nom:"Villers-Poterie",commune:"Gerpinnes",coord:[50.354914,4.541045]},
  {id:"joncret",nom:"Joncret",commune:"Gerpinnes",coord:[50.352989,4.502624]},
  {id:"gendarmerie",nom:"Gerpinnes - Gendarmerie",commune:"Gerpinnes",coord:[50.334168,4.508139]},
  {id:"loverval",nom:"Loverval",commune:"Gerpinnes",coord:[50.375579,4.462618]},
  {id:"fromiee",nom:"Fromiée",commune:"Gerpinnes",coord:[50.329661,4.5639]},
  {id:"centre",nom:"Gerpinnes-Centre",commune:"Gerpinnes",coord:[50.33768,4.515726]},
  {id:"gougnies",nom:"Gougnies",commune:"Gerpinnes",coord:[50.357904,4.568197]},
];
const CIM_BY_ALLEE={};

const PRENOMS_H=["Jean","Pierre","Louis","Paul","Marcel","André","Georges","Henri","Albert","Émile","François","Joseph","Victor","Marcel","Fernand","Léon","Robert","Gaston"];
const PRENOMS_F=["Marie","Anne","Jeanne","Élise","Yvonne","Suzanne","Léa","Camille","Rose","Madeleine","Sophie","Claire","Hélène","Gabrielle","Berthe","Simonne","Denise"];
const NOMS=["Dubois","Lambert","Lejeune","Dupont","Renard","Collin","Henry","Simon","Leroy","Martin","Dethier","Pirard","Gérard","Hubert","Lecomte","Body","Detry","Fontaine","Closset","Delvaux","Bastin","Counet","Massart","Piette","Servais","Thiry","Counson","Wautelet","Dewez","Bertrand"];
const LIEUX=["Corroy-le-Grand","Wavre","Bomel","Bouge","Jambes","Ottignies","Grez-Doiceau","Nethen","Beauvechain"];
const PF=["PF Lebrun","PF Gérard","PF Dethier & Fils","PF Wavre Centre","PF Sérénité"];
const FOSS=["Équipe Nord","Équipe Sud","Éq. centrale"];

function rng(seed){let s=seed%2147483647;if(s<=0)s+=2147483646;return()=>(s=s*16807%2147483647)/2147483647;}
function pick(r,a){return a[Math.floor(r()*a.length)];}
function d(r,y0,y1){const y=y0+Math.floor(r()*(y1-y0));const m=1+Math.floor(r()*12);const j=1+Math.floor(r()*28);return `${String(j).padStart(2,"0")}/${String(m).padStart(2,"0")}/${y}`;}
const yearOf=s=>+s.slice(-4);

const PLACES_BY_NATURE={caveau:4,pleine_terre:2,columbarium:1,cavurne:1,terre_commune:1,sihl:1,pelouse:1};

function buildRecord(plot){
  const r=rng(hash(plot.ref));
  const nom=pick(r,NOMS), nom2=pick(r,NOMS);
  const respPrenom=r()>.5?pick(r,PRENOMS_F):pick(r,PRENOMS_H);
  const placesTot=plot.special&&plot.nature==="dispersion"?0:(PLACES_BY_NATURE[plot.nature]||2);
  // dates cohérentes avec le statut
  let octroi,exp,duree="30 ans";
  if(plot.nature==="sihl"){octroi="—";exp="—";duree="Perpétuelle";}
  else if(plot.statut==="echue"){octroi=d(r,1986,1994);exp=`${yearOf(octroi)+30}`;}
  else if(plot.statut==="renouvellement"){octroi=d(r,1994,1997);exp=`${yearOf(octroi)+30}`;}
  else {octroi=d(r,1998,2018);exp=`${yearOf(octroi)+30}`;}
  // inhumés
  const nInh=plot.statut==="libre"?0:1+Math.floor(r()*Math.min(placesTot||1,3));
  const inhumes=[];
  for(let i=0;i<nInh;i++){
    const pr=r()>.5?pick(r,PRENOMS_F):pick(r,PRENOMS_H);
    const nais=d(r,1915,1955), dec=d(r,1995,2022);
    inhumes.push({nom:`${pr} ${nom}`,naissance:nais,deces:dec,inhum:dec,pf:pick(r,PF),fossoyeur:pick(r,FOSS)});
  }
  const placesOcc=Math.min(inhumes.length,placesTot);
  // schéma de places
  const cells=[];
  if(placesTot===4){const lab=["Étage haut – Gauche","Étage haut – Droite","Étage bas – Gauche","Étage bas – Droite"];for(let i=0;i<4;i++)cells.push({pos:lab[i],occupe:i<placesOcc,nom:i<placesOcc?inhumes[i]?.nom:null,date:i<placesOcc?inhumes[i]?.inhum:null});}
  else for(let i=0;i<placesTot;i++)cells.push({pos:`Position ${i+1}`,occupe:i<placesOcc,nom:i<placesOcc?inhumes[i]?.nom:null,date:i<placesOcc?inhumes[i]?.inhum:null});

  const respo={nom:`${nom} ${respPrenom}`,prenom:respPrenom,nn:`${10+Math.floor(r()*80)}${String(Math.floor(r()*9999999)).padStart(7,"0")}`,lieu:pick(r,LIEUX),naissance:d(r,1940,1975),adresse:`${1+Math.floor(r()*200)} rue ${pick(r,["du Tilleul","de l'Église","des Combattants","du Centre","Haute"])}, ${pick(r,LIEUX)}`};
  const benef=[];for(let i=0;i<1+Math.floor(r()*3);i++){const pr=r()>.5?pick(r,PRENOMS_F):pick(r,PRENOMS_H);benef.push({nom:`${nom} ${pr}`,naissance:d(r,1955,1990),parente:pick(r,["Fils","Fille","Épouse","Petit-fils","Sœur"])});}

  const recID=plot.fiche||{};
  return {
    ref:plot.ref, cimetiere:CIM_BY_ALLEE[(plot.ref||"").split("/")[0].replace(/[0-9].*/,"")]||"Belgrade", numInterne:1000+Math.floor(r()*8999),
    denom1: plot.nature==="dispersion"?"Aire de dispersion — parcelle cinéraire":
            plot.nature==="ossuaire"?"Ossuaire communal":
            plot.statut==="libre"?"Emplacement libre":`Famille ${nom.toUpperCase()} – ${nom2.toUpperCase()}`,
    denom2: r()>.6?`dite « ${pick(r,["Au Repos","Souvenir","Mémoire"])} »`:"",
    nature:plot.nature, statut:plot.statut, octroi, expiration:plot.nature==="sihl"?"—":exp, duree,
    derniereInhum: inhumes.length?inhumes[inhumes.length-1].inhum:"—",
    // emplacement / description
    typeOuverture: plot.nature==="caveau"?"Dessus":pick(r,["Dessus","Latérale"]),
    modeOuverture: plot.nature==="caveau"?"Dalle béton":pick(r,["Pleine terre","Dalle"]),
    codeOuverture: `OUV-${100+Math.floor(r()*899)}`,
    longueur:(plot.nature==="caveau"?2.4:2.1).toFixed(2), largeur:(1.0+r()*0.6).toFixed(2), profondeur:(plot.nature==="caveau"?(1.8+r()).toFixed(2):(1.5).toFixed(2)),
    placesTot, placesOcc, placesDisp:Math.max(0,placesTot-placesOcc), placesVendues:placesOcc, urnes:plot.nature==="columbarium"||plot.nature==="cavurne"?placesOcc:0,
    observations: r()>.7?pick(r,["Entretien à surveiller — mousse sur la dalle.","Tombe d'enfants — voir courrier annexe.","Concession contiguë à reprendre simultanément.","Monument penché — sécurisation recommandée."]):"",
    cells, inhumes,
    personnes:{concessionnaire:[respo], responsable:[respo], beneficiaire:benef, autre: r()>.8?[{nom:`${pick(r,NOMS)} ${pick(r,PRENOMS_F)}`,parente:"Chargé de l'entretien"}]:[]},
    monument: plot.statut==="libre"?null:{type:pick(r,["Stèle","Pierre tombale","Croix","Chapelle"]),materiau:pick(r,["Petit granit","Granit gris","Marbre blanc","Pierre bleue"]),placeur:pick(r,["Marbrerie Dubois","Marbrerie Wavre","Éts Pirard"]),sculpteur:r()>.7?pick(r,NOMS):"—",etat:pick(r,["Bon","Moyen","À restaurer"]),reparation:r()>.8?"Lettrage à reprendre":"—"},
    prorogations: plot.statut==="renouvellement"?[{dateDemande:d(r,2024,2026),duree:"30 ans",accordCollege:"En attente",date:"—"}]:(yearOf(exp)<2024&&plot.nature!=="sihl"?[{dateDemande:"06/01/2016",duree:"30 ans",accordCollege:"Accordé",date:"06/01/2016"}]:[]),
    etat:{codeEtat:pick(r,["Bon","Moyen","Dégradé"]),travaux:r()>.8?"En cours":"—",desaffection:plot.statut==="reprise"?"Engagée":"Aucune",affichageDebut:plot.statut==="echue"||plot.statut==="reprise"?d(r,2024,2025):"—",affichageFin:plot.statut==="echue"||plot.statut==="reprise"?d(r,2025,2026):"—"},
    cendres:{destination:plot.nature==="columbarium"||plot.nature==="cavurne"?"Inhumation d'urne":(plot.nature==="dispersion"?"Dispersion (registre tenu)":"—"),conservationDomicile:"Non",partieSymbolique:"Non"},
    deplacements:"Aucun",
    sihl: plot.nature==="sihl"?{motif:"Décret GW 6 mars 2009 – Art. L1232-29",categorie:"Ancien combattant 14-18",architecture:"Stèle en petit granit, croix latine, épitaphe gravée et insigne militaire.",inventaire:"SIHL-2024-017"}:null,
    documents:[{nom:"Titre de concession.pdf",date:octroi},...(r()>.6?[{nom:"Décision collège.pdf",date:d(r,2010,2024)}]:[]),...(plot.statut==="echue"?[{nom:"PV de constat d'abandon.pdf",date:d(r,2024,2025)}]:[])],
    notesTerrain:{monument:pick(r,["Stèle dressée","Pierre couchée","Chapelle"]),epitaphes:r()>.5?"« Regrets éternels »":"—",etat:pick(r,["Correct","Mousse","Fissure"]),reparation:r()>.85?"Croix à refixer":"—"},
    historique:[
      {date:octroi==="—"?"11/11/1920":octroi,encodeur:"Import initial",statut:"Validé",action:"Création"},
      ...(plot.statut==="renouvellement"?[{date:d(r,2025,2026),encodeur:"M.-H. Mathon",statut:"En attente",action:"Demande de prorogation"}]:[]),
      ...(plot.statut==="echue"?[{date:d(r,2024,2025),encodeur:"Fossoyeur",statut:"Validé",action:"Constat d'état d'abandon"}]:[]),
    ],
  };
}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return Math.abs(h);}

// ---- plan ----
const ALLEES=["ALM","BRT","CHE","DUM"];
function buildPlots(){
  const plots=[];let n=0;
  const blocks=[{a:"ALM",ox:40,oy:40,c:5,r:6},{a:"BRT",ox:300,oy:40,c:4,r:6},{a:"CHE",ox:40,oy:340,c:6,r:4},{a:"DUM",ox:360,oy:340,c:4,r:4}];
  const nk=["pleine_terre","caveau","cavurne","columbarium","terre_commune"];
  blocks.forEach(b=>{for(let row=0;row<b.r;row++)for(let col=0;col<b.c;col++){n++;const ref=`${b.a}/T${row*b.c+col+1}`;const r=(n*9301+49297)%233280/233280;let nature=nk[Math.floor(r*nk.length)],statut="occupe";if(r<.15){statut="libre";nature=null;}else if(r>.88)statut="echue";else if(r>.80)statut="renouvellement";else if(r>.78)statut="reprise";plots.push({id:ref,ref,allee:b.a,nature,statut,x:b.ox+col*46,y:b.oy+row*42,w:38,h:34});}});
  plots.push({id:"ALM/H1",ref:"ALM/H1",allee:"ALM",nature:"sihl",statut:"occupe",x:40,y:300,w:84,h:28,special:true});
  plots.push({id:"DISP/1",ref:"DISP/1",allee:"DUM",nature:"dispersion",statut:"occupe",x:360,y:300,w:130,h:30,special:true});
  plots.push({id:"OSS/1",ref:"OSS/1",allee:"CHE",nature:"ossuaire",statut:"occupe",x:250,y:300,w:60,h:28,special:true});
  plots.push({id:"ET/1",ref:"ET/1",allee:"BRT",nature:"etoiles",statut:"occupe",x:300,y:300,w:50,h:28,special:true});
  plots.push({id:"PH/1",ref:"PH/1",allee:"CHE",nature:"pelouse",statut:"occupe",x:130,y:300,w:100,h:28,special:true});
  return plots;
}
{ALLEES};

// ---- tarifs (configuration communale) ----
const TARIFS=[
  {nature:"Pleine terre",d15:"—",d30:"750 €",d50:"1 100 €",perp:"—",redevance:"—"},
  {nature:"Caveau (2 pl.)",d15:"—",d30:"1 250 €",d50:"1 900 €",perp:"—",redevance:"50 €/an"},
  {nature:"Caveau (4 pl.)",d15:"—",d30:"2 100 €",d50:"3 200 €",perp:"—",redevance:"50 €/an"},
  {nature:"Cavurne",d15:"350 €",d30:"600 €",d50:"—",perp:"—",redevance:"—"},
  {nature:"Cellule columbarium",d15:"450 €",d30:"800 €",d50:"—",perp:"—",redevance:"30 €/an"},
  {nature:"Parcelle des étoiles",d15:"—",d30:"Gratuit",d50:"—",perp:"—",redevance:"—"},
  {nature:"Dispersion",d15:"—",d30:"—",d50:"—",perp:"—",redevance:"forfait 60 €"},
];
const REGLES=[
  {k:"Durées de concession autorisées",v:"15 / 30 / 50 ans · parcelle des étoiles : 30 ans gratuits"},
  {k:"Délai de carence avant reprise",v:"1 an (affichage) après échéance"},
  {k:"Délai sanitaire exhumation",v:"15/11 → 15/04 · dérogations « confort » et « technique » (2026)"},
  {k:"Caveau / cellule d'attente",v:"7 semaines max · rappel famille à 5 semaines"},
  {k:"Cercueils pleine terre",v:"Bois massif ou matériau biodégradable (01/11/2026)"},
];

// ---- calendrier fossoyeurs ----
const CAL_TEAMS=["Équipe Nord","Équipe Sud","Équipe centrale"];
const CAL_DAYS=["Lun 23/06","Mar 24/06","Mer 25/06","Jeu 26/06","Ven 27/06","Sam 28/06"];
const CAL_TYPES={inhumation:{l:"Inhumation",c:"#1D48CC"},exhumation:{l:"Exhumation",c:"#7A271A"},travaux:{l:"Travaux marbrier",c:"#E08E33"},entretien:{l:"Entretien",c:"#2E971F"}};
const CAL_EVENTS=[
  {team:0,day:0,h:"09:00",type:"inhumation",ref:"ALM/T9",who:"PF Lebrun — F. Servais"},
  {team:0,day:3,h:"10:00",type:"inhumation",ref:"CHE/T11",who:"PF Gérard — M. Henry"},
  {team:1,day:1,h:"14:00",type:"travaux",ref:"BRT/T3",who:"Marbrerie Dubois"},
  {team:1,day:4,h:"11:00",type:"inhumation",ref:"DUM/T6",who:"PF Sérénité — J. Collin"},
  {team:2,day:2,h:"08:30",type:"exhumation",ref:"CHE/T7",who:"Exhum. confort — fam. Henry"},
  {team:2,day:5,h:"09:00",type:"entretien",ref:"Allée ALM",who:"Tonte + désherbage"},
  {team:0,day:4,h:"15:00",type:"travaux",ref:"ALM/T2",who:"Pose monument — Éts Pirard"},
  {team:1,day:2,h:"10:30",type:"inhumation",ref:"BRT/T12",who:"PF Wavre — A. Dubois"},
];

// ---- exhumations ----
const EXHUM=[
  {ref:"CHE/T7",type:"Confort",demandeur:"Famille Henry + Bourgmestre",date:"02/07/2026",sanitaire:"Dérogation requise",autorisation:"Ministérielle — en attente",statut:"Instruction",c:"#E08E33"},
  {ref:"ALM/T17",type:"Technique",demandeur:"Service travaux (réaffectation)",date:"05/05/2026",sanitaire:"Hors délai (chantier ≤ 15/05)",autorisation:"Collège — accordée",statut:"Planifiée",c:"#1D48CC"},
  {ref:"BRT/T8",type:"Judiciaire",demandeur:"Parquet de Nivelles",date:"—",sanitaire:"Non applicable",autorisation:"Réquisitoire",statut:"En attente",c:"#7A271A"},
];

// ---- types de documents (actes & autorisations) ----
const DOC_TYPES=[
  {k:"inhumer",nom:"Permis d'inhumer",base:"CDLD art. L1232-12",c:"#1D48CC"},
  {k:"exhumer",nom:"Permis d'exhumer",base:"CDLD art. L1232-5 — délai sanitaire",c:"#7A271A"},
  {k:"ossuaire",nom:"Autorisation de transfert vers l'ossuaire",base:"désaffectation — CDLD L1232-12",c:"#4F5B62"},
  {k:"cremation",nom:"Autorisation de crémation",base:"AR du 19/01/1973",c:"#E08E33"},
  {k:"dispersion",nom:"Autorisation de dispersion des cendres",base:"CDLD art. L1232-26 §2",c:"#2E971F"},
  {k:"transport",nom:"Autorisation de transport de corps",base:"police des funérailles",c:"#7D7C83"},
  {k:"titre",nom:"Titre de concession",base:"règlement communal",c:"#854B3D"},
  {k:"echeance",nom:"Avis d'échéance / renouvellement",base:"CDLD art. L1232-12 §2",c:"#CD0947"},
  {k:"sihl1945",nom:"Demande d'enlèvement / déplacement — sépulture < 1945",base:"AGW 29/10/2009 art. 44 — SPW IAS",c:"#E6790A"},
];

function qrDataURL(text){try{const qr=qrcodegen(0,"M");qr.addData(text||" ");qr.make();return qr.createDataURL(4,2);}catch(e){return "";}}
function fmtCoord(sys,lat,lng){try{
  if(sys==="l72"){const p=proj4("WGS84","EPSG:31370",[lng,lat]);return `Lambert 72 — X ${Math.round(p[0])}  Y ${Math.round(p[1])}`;}
  if(sys==="l08"){const p=proj4("WGS84","EPSG:3812",[lng,lat]);return `Lambert 2008 — X ${Math.round(p[0])}  Y ${Math.round(p[1])}`;}
  if(sys==="dms"){const d=v=>{const a=Math.abs(v),de=Math.floor(a),m=Math.floor((a-de)*60),s=(((a-de)*60-m)*60).toFixed(1);return `${de}°${m}'${s}"`;};return `WGS84 — ${d(lat)}N ${d(lng)}E`;}
  return `WGS84 — ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}catch(e){return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;}}

const PLOTS = buildPlots();
const RECORDS = Object.fromEntries(PLOTS.map(p=>[p.ref,buildRecord(p)]));

/* ---------- petits éléments ---------- */
const Pill=({color,children})=>(
  <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{background:color+"1A",color}}>
    <span className="h-1.5 w-1.5 rounded-full" style={{background:color}}/>{children}</span>);
const KV=({k,v,mono})=>(
  <div className="flex items-start justify-between gap-4 py-[5px] border-b border-slate-100 last:border-0">
    <span className="text-[11.5px] text-slate-500 shrink-0">{k}</span>
    <span className={`text-[12px] text-right ${mono?"font-mono text-slate-600":"font-medium text-slate-800"}`}>{v||"—"}</span></div>);
const Card=({title,icon,children,id})=>(
  <section id={id} className="rounded-xl border border-slate-200 bg-white">
    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-[12.5px] font-semibold text-slate-700">{icon}{title}</div>
    <div className="px-4 py-3">{children}</div></section>);

/* ---------- schéma de places ---------- */
function PlacesSchema({rec}){
  if(!rec.cells?.length) return <p className="text-[12px] italic text-slate-400">Aucune place (nature sans emplacement nominatif).</p>;
  const two=rec.cells.length===4;
  return(<div>
    <div className={`grid ${two?"grid-cols-2":"grid-cols-1 max-w-[240px]"} gap-2`}>
      {rec.cells.map((c,i)=>(
        <div key={i} className="rounded-md border p-2 text-[11px] leading-tight"
          style={{borderColor:c.occupe?"#334155":"#CBD5E1",background:c.occupe?"#1f2a33":"#F8FAFC",color:c.occupe?"#E2E8F0":"#64748B"}}>
          <div className="font-semibold">{c.pos}</div>
          {c.occupe?<><div>{c.nom}</div><div className="opacity-70">{c.date}</div></>:<div className="italic">Libre</div>}</div>))}
    </div>
    <p className="mt-2 text-[11px] text-slate-500">{rec.placesOcc}/{rec.placesTot} place(s) occupée(s) · {rec.placesDisp} disponible(s)</p></div>);
}

/* ---------- plan carto ---------- */
function PlanCanvas({plots,selected,onSelect,dim,colorOf}){
  const [t,setT]=useState({x:0,y:0,k:1});const drag=useRef(null);const moved=useRef(false);
  const dn=e=>{drag.current={x:e.clientX,y:e.clientY,t0:{...t}};moved.current=false;};
  const mv=e=>{if(!drag.current)return;const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y;if(Math.abs(dx)+Math.abs(dy)>4)moved.current=true;setT({...drag.current.t0,x:drag.current.t0.x+dx,y:drag.current.t0.y+dy});};
  const up=()=>{drag.current=null;};const zoom=f=>setT(p=>({...p,k:Math.min(3,Math.max(.5,p.k*f))}));
  return(<div className="relative h-full w-full overflow-hidden bg-[#EDF1EC]" style={{backgroundImage:"radial-gradient(#dfe6dd 1px,transparent 1px)",backgroundSize:"22px 22px"}}>
    <svg className="h-full w-full cursor-grab active:cursor-grabbing" viewBox="0 0 560 520"
      onPointerDown={dn} onPointerMove={mv} onPointerUp={up} onPointerLeave={up} onWheel={e=>{zoom(e.deltaY<0?1.12:.9);}}>
      <g transform={`translate(${t.x},${t.y}) scale(${t.k})`}>
        {plots.map(p=>{const nat=p.nature?NATURES[p.nature]:null;const st=STATUTS[p.statut];const sel=selected===p.id;const dd=dim(p);
          const fill=p.statut==="libre"?"#F4F7F3":(colorOf?colorOf(p):(nat?nat.color:"#cbd5e1"));
          return(<g key={p.id} opacity={dd?.18:1} style={{cursor:"pointer"}} onClick={()=>{if(!moved.current)onSelect(p.id);}}>
            <rect data-ref={p.ref} data-nature={p.nature||"libre"} x={p.x} y={p.y} width={p.w} height={p.h} rx={3}
              fill={fill} fillOpacity={p.statut==="libre"?1:.9} stroke={sel?"#0f172a":st.ring} strokeWidth={sel?3:(p.statut==="libre"?1:1.6)}
              strokeDasharray={p.statut==="libre"?"3 2":"none"}/>
            {(p.statut==="echue"||p.statut==="renouvellement"||p.statut==="reprise")&&!dd&&<circle cx={p.x+p.w-4} cy={p.y+4} r={3} fill={st.ring}/>}
            {(p.special||sel)&&<text x={p.x+p.w/2} y={p.y+p.h/2+3} textAnchor="middle" fontSize="7.5" fontFamily="ui-monospace,monospace" fill={p.statut==="libre"?"#64748b":"#fff"} fontWeight="600">{p.ref}</text>}
          </g>);})}
        {ALLEES.map(a=>{const xs={ALM:40,BRT:300,CHE:40,DUM:360}[a];const ys=a==="ALM"||a==="BRT"?28:328;return <text key={a} x={xs} y={ys} fontSize="11" fontWeight="700" fill="#5b6b58" fontFamily="ui-monospace,monospace">Allée {a}</text>;})}
      </g></svg>
    <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
      <button onClick={()=>zoom(1.2)} className="border-b border-slate-200 p-2 hover:bg-slate-50"><Plus size={15}/></button>
      <button onClick={()=>zoom(.83)} className="border-b border-slate-200 p-2 hover:bg-slate-50"><Minus size={15}/></button>
      <button onClick={()=>setT({x:0,y:0,k:1})} className="p-2 hover:bg-slate-50"><Crosshair size={15}/></button></div>
    <div className="absolute bottom-3 left-3 rounded-md bg-white/85 px-2 py-1 text-[10px] font-mono text-slate-500 backdrop-blur">Lambert 72 · 1:{Math.round(200/t.k)}</div></div>);
}

/* ---------- DOSSIER UNIQUE (fiche complète) ---------- */
const SECTIONS=[
  ["gen","Informations générales",<FileText size={14}/>],
  ["photos","Photos",<Camera size={14}/>],
  ["empl","Emplacement & description",<MapPin size={14}/>],
  ["places","Places",<Building2 size={14}/>],
  ["pers","Personnes liées",<Users size={14}/>],
  ["inh","Inhumations & cendres",<ScrollText size={14}/>],
  ["mon","Monument & travaux",<Hammer size={14}/>],
  ["interv","Demandes d'intervention",<Wrench size={14}/>],
  ["courriers","Courriers & échanges",<Mail size={14}/>],
  ["pro","Prorogations / maintiens",<RotateCcw size={14}/>],
  ["etat","État · désaffection · affichages",<AlertTriangle size={14}/>],
  ["sihl","Patrimoine (SIHL)",<Landmark size={14}/>],
  ["doc","Documents",<FileSignature size={14}/>],
  ["notes","Notes / images terrain",<ImageIcon size={14}/>],
  ["hist","Historique des modifications",<History size={14}/>],
];
const SENS_COL={"Envoyé":"#3a5aa0","Reçu":"#2E971F"};
function seedCourriers(rec){return [
  {id:1,date:"2024-03-12",sens:"Envoyé",canal:"Courrier",objet:"Avis d'échéance de concession",type:"Avis d'échéance",statut:"Envoyé"},
  {id:2,date:"2024-04-02",sens:"Reçu",canal:"E-mail",objet:"Demande de renouvellement (famille)",type:"Réponse famille",statut:"Reçu"},
  {id:3,date:"2024-04-15",sens:"Envoyé",canal:"Recommandé",objet:"Titre de concession renouvelé",type:"Titre de concession",statut:"Envoyé"},
];}
function gravePhoto(ref,v){
  const bgs=["#6b7280","#7c6f64","#566270","#7a6a55"];const bg=bgs[v%bgs.length];
  const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='480' height='340'><rect width='480' height='340' fill='#dfe3e8'/><rect y='235' width='480' height='105' fill='#aeb6bd'/><rect x='120' y='66' width='150' height='174' rx='10' fill='${bg}'/><rect x='138' y='90' width='114' height='84' rx='4' fill='#eef1f4' opacity='0.5'/><rect x='300' y='150' width='72' height='90' rx='6' fill='${bg}' opacity='0.85'/><text x='240' y='300' font-family='sans-serif' font-size='18' fill='#3b4252' text-anchor='middle'>${ref}</text></svg>`;
  return "data:image/svg+xml;utf8,"+encodeURIComponent(svg);
}
function seedPhotos(ref){return [
  {id:"p1",url:gravePhoto(ref,0),label:"Vue générale",principal:true,date:"2024-09"},
  {id:"p2",url:gravePhoto(ref,1),label:"Monument",principal:false,date:"2024-09"},
  {id:"p3",url:gravePhoto(ref,2),label:"Inscription",principal:false,date:"2023-05"},
];}
function readImg(e,cb){const f=e.target.files&&e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>cb(r.result,f.name);r.readAsDataURL(f);}
/* ---------- DEMANDES D'INTERVENTION ---------- */
const INTERV_MOTIFS=["Manque d'entretien","Monument penché / dangereux","Végétation envahissante","Plaque / ornement descellé","Nettoyage requis","Sépulture endommagée","Affaissement de terrain","Autre"];
const INTERV_PRIO={"Basse":"#94A3B8","Normale":"#3a5aa0","Haute":"#E08E33","Urgente":"#C0392B"};
const INTERV_STATUT={"Ouverte":"#3a5aa0","En cours":"#E08E33","Réalisée":"#2E971F","Notifiée famille":"#7C3AED","Régularisée":"#2E971F","Sans suite":"#94A3B8"};
const SEED_INTERV=[
  {id:"IV-2026-014",ref:"ALM/B/03",cimetiere:"Belgrade",destinataire:"Famille",motif:"Manque d'entretien",priorite:"Haute",statut:"Notifiée famille",date:"2026-06-10",description:"Sépulture envahie par la végétation, lettrage illisible. Courrier envoyé au concessionnaire.",photos:[{id:"a",url:gravePhoto("ALM/B/03",1),label:"État constaté"}]},
  {id:"IV-2026-015",ref:"CHE/T7",cimetiere:"Belgrade",destinataire:"Service interne",motif:"Monument penché / dangereux",priorite:"Urgente",statut:"En cours",date:"2026-06-18",description:"Stèle instable, risque de chute. Périmètre sécurisé, intervention équipe Sud planifiée.",photos:[{id:"b",url:gravePhoto("CHE/T7",2),label:"Stèle"}]},
  {id:"IV-2026-016",ref:"DIO/C/01",cimetiere:"Bouge",destinataire:"Service interne",motif:"Nettoyage requis",priorite:"Normale",statut:"Ouverte",date:"2026-06-22",description:"Nettoyage de la cellule columbarium avant nouvelle inhumation d'urne.",photos:[]},
];
function InterventionModal({initRef,records,onClose,onCreate}){
  const refs=Object.keys(records||{});
  const [f,setF]=useState({ref:initRef||refs[0]||"",destinataire:"Service interne",motif:INTERV_MOTIFS[0],priorite:"Normale",description:"",photos:[]});
  const up=(k,v)=>setF(s=>({...s,[k]:v}));
  const addPhoto=e=>readImg(e,url=>setF(s=>({...s,photos:[...s.photos,{id:Date.now(),url,label:"Photo"}]})));
  const submit=()=>{const rc=records[f.ref];onCreate({id:"IV-"+Date.now(),ref:f.ref,cimetiere:rc?.cimetiere||"—",destinataire:f.destinataire,motif:f.motif,priorite:f.priorite,description:f.description,statut:f.destinataire==="Famille"?"Notifiée famille":"Ouverte",date:ymd(new Date(2026,5,24)),photos:f.photos});};
  return(<div className="fixed inset-0 z-[9998] grid place-items-center bg-black/30 p-4" onClick={onClose}>
    <div className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl" onClick={e=>e.stopPropagation()}>
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3"><span className="flex items-center gap-2 text-[13.5px] font-semibold text-slate-800"><Wrench size={16} className="text-[#CD0947]"/>Demande d'intervention</span><button onClick={onClose}><X size={18} className="text-slate-400"/></button></div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4">
        <Field label="Concession">{initRef?<Inp value={f.ref} onChange={()=>{}}/>:<Sel value={f.ref} onChange={e=>up("ref",e.target.value)}>{refs.slice(0,300).map(r=>{const rc=records[r];return <option key={r} value={r}>{r} — {rc&&rc.denom1}</option>;})}</Sel>}</Field>
        <Field label="Destinataire"><Sel value={f.destinataire} onChange={e=>up("destinataire",e.target.value)}><option>Service interne</option><option>Famille</option></Sel></Field>
        <Field label="Motif"><Sel value={f.motif} onChange={e=>up("motif",e.target.value)}>{INTERV_MOTIFS.map(m=><option key={m}>{m}</option>)}</Sel></Field>
        <Field label="Priorité"><Sel value={f.priorite} onChange={e=>up("priorite",e.target.value)}>{Object.keys(INTERV_PRIO).map(p=><option key={p}>{p}</option>)}</Sel></Field>
        <Field label="Description / constat" full><Txt value={f.description} onChange={e=>up("description",e.target.value)}/></Field>
        <div className="col-span-2">
          <div className="mb-1 text-[11px] font-medium text-slate-500">Photos</div>
          <div className="flex flex-wrap items-center gap-2">
            {f.photos.map((p,i)=><img key={i} src={p.url} className="h-16 w-20 rounded-md border border-slate-200 object-cover"/>)}
            <label className="flex h-16 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 text-[10px] text-slate-400 hover:border-[#CD0947]/40 hover:text-[#CD0947]"><Camera size={16}/>Ajouter<input type="file" accept="image/*" className="hidden" onChange={addPhoto}/></label>
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white px-4 py-3">
        <button onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-[12.5px] text-slate-700 hover:bg-slate-100">Annuler</button>
        <button onClick={submit} className="rounded-md bg-[#CD0947] px-4 py-2 text-[12.5px] font-medium text-white hover:opacity-90">Créer la demande</button>
      </div>
    </div></div>);
}
function Interventions({interventions,records,onAdd,onStatut}){
  const [create,setCreate]=useState(false);const [openId,setOpenId]=useState(null);
  const [fStatut,setFStatut]=useState("Tous");const [fDest,setFDest]=useState("Tous");
  const rows=interventions.filter(i=>(fStatut==="Tous"||i.statut===fStatut)&&(fDest==="Tous"||i.destinataire===fDest));
  const open=interventions.find(i=>i.id===openId);
  const NEXT={"Ouverte":["En cours","Sans suite"],"En cours":["Réalisée","Sans suite"],"Notifiée famille":["Régularisée","Sans suite"],"Réalisée":[],"Régularisée":[],"Sans suite":["Ouverte"]};
  if(open)return(<div className="h-full overflow-auto bg-slate-50 p-5"><div className="mx-auto max-w-3xl">
    <button onClick={()=>setOpenId(null)} className="mb-3 text-[12px] text-slate-500 hover:text-slate-800">‹ Liste des interventions</button>
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><div className="flex items-center gap-2"><h2 className="text-[15px] font-semibold text-slate-800">{open.motif}</h2><span className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{background:INTERV_STATUT[open.statut]}}>{open.statut}</span></div>
          <div className="mt-0.5 text-[12px] text-slate-500">{open.id} · concession <span className="font-mono">{open.ref}</span> · {open.cimetiere} · {open.date}</div></div>
        <div className="flex items-center gap-2">
          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{background:INTERV_PRIO[open.priorite]}}>{open.priorite}</span>
          <span className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600">{open.destinataire}</span></div>
      </div>
      <p className="mt-3 text-[12.5px] text-slate-700">{open.description}</p>
      {open.photos&&open.photos.length>0&&<div className="mt-3 flex flex-wrap gap-2">{open.photos.map((p,i)=><figure key={i} className="overflow-hidden rounded-lg border border-slate-200"><img src={p.url} className="h-32 w-44 object-cover"/><figcaption className="px-2 py-1 text-[10.5px] text-slate-500">{p.label}</figcaption></figure>)}</div>}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        {(NEXT[open.statut]||[]).map(st=><button key={st} onClick={()=>onStatut(open.id,st)} className="rounded-md px-3 py-1.5 text-[12px] font-medium text-white" style={{background:INTERV_STATUT[st]||"#475569"}}>Marquer : {st}</button>)}
        {open.destinataire==="Famille"&&<button onClick={()=>toast("Courrier de notification généré")} className="rounded-md border border-slate-300 px-3 py-1.5 text-[12px] text-slate-700 hover:bg-slate-100">Générer le courrier famille</button>}
      </div>
    </div></div></div>);
  return(<div className="h-full overflow-auto bg-slate-50 p-5">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-[15px] font-semibold text-slate-800">Demandes d'intervention</h2>
        <p className="text-[11.5px] text-slate-500">Interventions sur sépultures — service interne ou notification aux familles (entretien, sécurité…).</p></div>
      <button onClick={()=>setCreate(true)} className="flex items-center gap-1.5 rounded-md bg-[#CD0947] px-3.5 py-2 text-[12.5px] font-medium text-white hover:opacity-90"><Plus size={15}/>Nouvelle demande</button>
    </div>
    <div className="mb-3 flex flex-wrap gap-2 text-[12px]">
      <Sel value={fStatut} onChange={e=>setFStatut(e.target.value)}><option>Tous</option>{Object.keys(INTERV_STATUT).map(s=><option key={s}>{s}</option>)}</Sel>
      <Sel value={fDest} onChange={e=>setFDest(e.target.value)}><option>Tous</option><option>Service interne</option><option>Famille</option></Sel>
    </div>
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-[12px]"><thead><tr className="border-b border-slate-200 text-left text-[10.5px] uppercase tracking-wide text-slate-400">
        {["Réf.","Concession","Cimetière","Destinataire","Motif","Priorité","Statut","Photos","Date"].map(h=><th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
        <tbody>{rows.map(i=>(<tr key={i.id} onClick={()=>setOpenId(i.id)} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50">
          <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{i.id}</td>
          <td className="px-3 py-2 font-mono font-medium text-slate-800">{i.ref}</td>
          <td className="px-3 py-2 text-slate-600">{i.cimetiere}</td>
          <td className="px-3 py-2 text-slate-600">{i.destinataire}</td>
          <td className="px-3 py-2 text-slate-700">{i.motif}</td>
          <td className="px-3 py-2"><span className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{background:INTERV_PRIO[i.priorite]}}>{i.priorite}</span></td>
          <td className="px-3 py-2"><span className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{background:INTERV_STATUT[i.statut]}}>{i.statut}</span></td>
          <td className="px-3 py-2 text-slate-500">{i.photos?.length?<span className="inline-flex items-center gap-1"><Camera size={12}/>{i.photos.length}</span>:"—"}</td>
          <td className="px-3 py-2 font-mono text-slate-500">{i.date}</td></tr>))}</tbody></table>
    </div>
    {create&&<InterventionModal records={records} onClose={()=>setCreate(false)} onCreate={iv=>{onAdd(iv);setCreate(false);}}/>}
  </div>);
}
function Dossier({rec:rec0,onBack,interventions=[],onAddIntervention,onUpdateRecord,onPlan,onQR}){
  const [rec,setRec]=useState(()=>({...rec0,photos:(rec0.photos&&rec0.photos.length)?rec0.photos:seedPhotos(rec0.ref),courriers:rec0.courriers||seedCourriers(rec0)}));
  const [edit,setEdit]=useState(false);
  const [active,setActive]=useState("gen");
  const [shownPhoto,setShownPhoto]=useState(0);
  const [ivOpen,setIvOpen]=useState(false);
  const [prodType,setProdType]=useState("echeance");
  const photos=rec.photos||[];
  const principalIdx=Math.max(0,photos.findIndex(p=>p.principal));
  const addPhoto=e=>readImg(e,url=>setRec(r=>({...r,photos:[...(r.photos||[]),{id:Date.now(),url,label:"Photo terrain",date:"2026-06"}]})));
  const setPrincipal=i=>setRec(r=>({...r,photos:r.photos.map((p,j)=>({...p,principal:j===i}))}));
  const delPhoto=i=>setRec(r=>({...r,photos:r.photos.filter((_,j)=>j!==i)}));
  const myInterv=interventions.filter(i=>i.ref===rec.ref);
  const archived=rec.statut==="archive";
  const addCourrier=c=>setRec(r=>({...r,courriers:[{id:Date.now(),...c},...(r.courriers||[])]}));
  const produceDoc=()=>{const cur=DOC_TYPES.find(d=>d.k===prodType)||DOC_TYPES[0];
    const merged=mergeText(DEFAULT_TPL[cur.k]||"",buildMergeData(rec));
    genPdf(cur.nom,cur.base,merged.split(/\n{2,}/),cur.k+".pdf");
    addCourrier({date:"2026-06-25",sens:"Envoyé",canal:"Courrier",objet:cur.nom,type:cur.nom,statut:"Généré",body:merged});
    toast("Document produit et journalisé");};
  const uploadScan=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const isImg=/^image\//.test(f.type);
    const push=url=>addCourrier({date:"2026-06-25",sens:"Reçu",canal:/\.msg$/i.test(f.name)?"E-mail (.msg)":"Courrier scanné",objet:f.name,type:"Pièce jointe",statut:"Archivé",attachment:{name:f.name,url,img:isImg}});
    if(isImg){const rd=new FileReader();rd.onload=()=>push(rd.result);rd.readAsDataURL(f);}else push(null);
    toast("Pièce jointe ajoutée à l'historique");e.target.value="";};
  const archiver=()=>{setRec(r=>({...r,statut:"archive",courriers:[{id:Date.now(),date:"2026-06-25",sens:"Reçu",canal:"Guichet",objet:"Abandon de concession par la famille",type:"Abandon",statut:"Archivé"},...(r.courriers||[])],historique:[{date:"2026-06-25",encodeur:"PB",action:"Mise en archives (abandon famille)",statut:"Validé"},...(r.historique||[])]}));onUpdateRecord&&onUpdateRecord(rec.ref,{statut:"archive"});toast("Concession archivée — disponible à la revente");};
  const remettreEnVente=()=>{setRec(r=>({...r,statut:"libre",historique:[{date:"2026-06-25",encodeur:"PB",action:"Remise en vente",statut:"Validé"},...(r.historique||[])]}));onUpdateRecord&&onUpdateRecord(rec.ref,{statut:"libre"});toast("Concession remise en vente");};
  const nat=rec.nature?NATURES[rec.nature]:null;const st=STATUTS[rec.statut]||{label:rec.statut||"—",ring:"#64748B"};
  const refs=useRef({});
  const go=k=>{setActive(k);refs.current[k]?.scrollIntoView({behavior:"smooth",block:"start"});};
  const secs=SECTIONS_FILTER(rec);
  return(<div className="flex h-full min-h-0 bg-slate-50">
    {/* index */}
    <nav className="w-60 shrink-0 border-r border-slate-200 bg-white p-3">
      <button onClick={onBack} className="mb-3 flex items-center gap-1 text-[12px] text-slate-500 hover:text-slate-800"><ChevronLeft size={15}/>Retour</button>
      <div className="px-1">
        <div className="font-mono text-[15px] font-semibold text-slate-900">{rec.ref}</div>
        <div className="mt-0.5 text-[12px] text-slate-600">{rec.denom1}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">{nat&&<Pill color={nat.color}>{nat.label}</Pill>}<Pill color={st.ring}>{st.label}</Pill></div>
        <button onClick={()=>onPlan&&onPlan(rec.ref)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-[#CD0947] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90"><Map size={14}/>Voir sur le plan</button>
        <button onClick={()=>onQR&&onQR({ref:rec.ref,defunt:(rec.inhumes&&rec.inhumes[0]&&rec.inhumes[0].nom)||rec.denom1})} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-[#CD0947]/40 px-3 py-1.5 text-[12px] font-medium text-[#CD0947] hover:bg-[#CD0947]/5"><QrCode size={14}/>QR mémoriel — commander une plaque</button>
      </div>
      <div className="mt-4 space-y-0.5">
        {secs.map(([k,label,icon])=>(
          <button key={k} onClick={()=>go(k)} className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] ${active===k?"bg-slate-800 text-white":"text-slate-600 hover:bg-slate-100"}`}>{icon}<span className="truncate">{label}</span></button>))}
      </div>
    </nav>
    {/* contenu */}
    <div className="min-w-0 flex-1 overflow-y-auto p-5">
      <div className="mx-auto max-w-3xl space-y-4">
        {photos.length>0&&<div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="relative"><img src={photos[principalIdx].url} className="h-52 w-full object-cover"/>
            <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white"><Star size={11} className="mb-0.5 mr-1 inline"/>Image principale · {photos[principalIdx].label}</span></div>
        </div>}

        {archived&&<div className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 p-3 text-[12.5px] text-violet-900"><Archive size={18}/><div className="flex-1"><b>Concession archivée</b> — abandonnée par la famille. L'emplacement peut être remis en vente pour une nouvelle famille.</div><button onClick={remettreEnVente} className="rounded-md bg-violet-700 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-violet-800">Remettre en vente</button></div>}

        <div ref={el=>refs.current.gen=el}><Card title="Informations générales" icon={<FileText size={14}/>}>
          <div className="grid grid-cols-2 gap-x-8">
            <div><KV k="Cimetière" v={rec.cimetiere}/><KV k="Référence" v={rec.ref} mono/><KV k="N° interne" v={rec.numInterne} mono/><KV k="Dénomination (1)" v={rec.denom1}/><KV k="Dénomination (2)" v={rec.denom2}/></div>
            <div><KV k="Nature" v={nat?.label}/><KV k="Durée" v={rec.duree}/><KV k="Date d'octroi" v={rec.octroi} mono/><KV k="Date d'expiration" v={rec.expiration} mono/><KV k="Dernière inhumation" v={rec.derniereInhum} mono/></div>
          </div>
          {rec.observations&&<div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-[11.5px] text-amber-900"><AlertTriangle size={13} className="mb-0.5 mr-1 inline"/>{rec.observations}</div>}
        </Card></div>

        <div ref={el=>refs.current.photos=el}><Card title="Photos" icon={<Camera size={14}/>}>
          {photos.length>0?<>
            <div className="overflow-hidden rounded-lg border border-slate-200"><img src={photos[shownPhoto]?.url||photos[principalIdx].url} className="h-64 w-full object-cover"/></div>
            <div className="mt-2 flex flex-wrap gap-2">
              {photos.map((p,i)=>(<div key={i} className="group relative">
                <img src={p.url} onClick={()=>setShownPhoto(i)} className={`h-16 w-24 cursor-pointer rounded-md border-2 object-cover ${i===shownPhoto?"border-[#CD0947]":"border-transparent hover:border-slate-300"}`}/>
                {p.principal&&<span className="absolute left-1 top-1 rounded bg-[#CD0947] px-1 text-[9px] text-white">Principale</span>}
                <div className="mt-0.5 flex items-center justify-between text-[9.5px] text-slate-400"><span className="truncate">{p.label}</span></div>
                <div className="mt-0.5 flex gap-1">
                  {!p.principal&&<button onClick={()=>setPrincipal(i)} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] text-slate-600 hover:bg-slate-200">★ principale</button>}
                  <button onClick={()=>delPhoto(i)} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] text-slate-500 hover:bg-red-50 hover:text-red-500">supprimer</button>
                </div>
              </div>))}
              <label className="flex h-16 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 text-[10px] text-slate-400 hover:border-[#CD0947]/40 hover:text-[#CD0947]"><Camera size={16}/>Ajouter<input type="file" accept="image/*" className="hidden" onChange={addPhoto}/></label>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">L'image principale s'affiche en tête de la fiche. Les autres photos restent liées à la concession.</p>
          </>:<label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#CD0947]"><Camera size={15}/>Ajouter une première photo<input type="file" accept="image/*" className="hidden" onChange={addPhoto}/></label>}
        </Card></div>

        <div ref={el=>refs.current.empl=el}><Card title="Emplacement & description" icon={<MapPin size={14}/>}>
          <div className="grid grid-cols-2 gap-x-8">
            <div><KV k="Type d'ouverture" v={rec.typeOuverture}/><KV k="Mode d'ouverture" v={rec.modeOuverture}/><KV k="Code ouverture" v={rec.codeOuverture} mono/><KV k="Longueur" v={rec.longueur+" m"} mono/><KV k="Largeur" v={rec.largeur+" m"} mono/><KV k="Profondeur" v={rec.profondeur+" m"} mono/></div>
            <div><KV k="Places totales" v={rec.placesTot} mono/><KV k="Places occupées" v={rec.placesOcc} mono/><KV k="Places disponibles" v={rec.placesDisp} mono/><KV k="Places vendues" v={rec.placesVendues} mono/><KV k="Urnes" v={rec.urnes} mono/></div>
          </div>
        </Card></div>

        <div ref={el=>refs.current.places=el}><Card title="Places" icon={<Building2 size={14}/>}><PlacesSchema rec={rec}/></Card></div>

        <div ref={el=>refs.current.pers=el}><Card title="Personnes liées" icon={<Users size={14}/>}>
          <PersonGroup title="Responsable(s) / concessionnaire" people={rec.personnes.responsable}/>
          <PersonGroup title="Bénéficiaire(s)" people={rec.personnes.beneficiaire}/>
          {rec.personnes.autre?.length>0&&<PersonGroup title="Autre(s)" people={rec.personnes.autre}/>}
        </Card></div>

        <div ref={el=>refs.current.inh=el}><Card title="Inhumations & cendres" icon={<ScrollText size={14}/>}>
          {rec.inhumes.length?(<table className="w-full text-[12px]"><thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-slate-400"><th className="py-1">Défunt</th><th>Naissance</th><th>Décès</th><th>Inhumation</th><th>Pompes funèbres</th></tr></thead>
            <tbody>{rec.inhumes.map((x,i)=>(<tr key={i} className="border-t border-slate-100"><td className="py-1.5 font-medium text-slate-800">{x.nom}</td><td className="font-mono text-slate-500">{x.naissance}</td><td className="font-mono text-slate-500">{x.deces}</td><td className="font-mono text-slate-500">{x.inhum}</td><td className="text-slate-600">{x.pf}</td></tr>))}</tbody></table>):<p className="text-[12px] italic text-slate-400">Aucune inhumation enregistrée.</p>}
          <div className="mt-3 grid grid-cols-3 gap-x-8 border-t border-slate-100 pt-2">
            <KV k="Destination des cendres" v={(rec.cendres||{}).destination}/><KV k="Conservation à domicile" v={(rec.cendres||{}).conservationDomicile}/><KV k="Déplacements" v={rec.deplacements}/></div>
          {rec._saphir&&<div className="mt-3 border-t border-slate-100 pt-3"><NamurDefuntsByFeature saphir={rec._saphir}/></div>}
        </Card></div>

        <div ref={el=>refs.current.mon=el}><Card title="Monument & travaux" icon={<Hammer size={14}/>}>
          {rec.monument?(<div className="grid grid-cols-2 gap-x-8"><div><KV k="Type" v={rec.monument.type}/><KV k="Matériau" v={rec.monument.materiau}/><KV k="État" v={rec.monument.etat}/></div><div><KV k="Placeur (marbrier)" v={rec.monument.placeur}/><KV k="Sculpteur" v={rec.monument.sculpteur}/><KV k="Réparation" v={rec.monument.reparation}/></div></div>):<p className="text-[12px] italic text-slate-400">Pas de monument.</p>}
        </Card></div>

        <div ref={el=>refs.current.interv=el}><Card title="Demandes d'intervention" icon={<Wrench size={14}/>}>
          <div className="mb-2 flex justify-end"><button onClick={()=>setIvOpen(true)} className="flex items-center gap-1.5 rounded-md bg-[#CD0947] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90"><Plus size={14}/>Demander une intervention</button></div>
          {myInterv.length?myInterv.map(i=>(<div key={i.id} className="flex items-center gap-3 border-t border-slate-100 py-2 first:border-0">
            {i.photos&&i.photos[0]?<img src={i.photos[0].url} className="h-12 w-16 shrink-0 rounded object-cover"/>:<span className="grid h-12 w-16 shrink-0 place-items-center rounded bg-slate-100 text-slate-300"><Wrench size={16}/></span>}
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-[12.5px] font-medium text-slate-800">{i.motif}</span>
              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white" style={{background:INTERV_PRIO[i.priorite]}}>{i.priorite}</span>
              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white" style={{background:INTERV_STATUT[i.statut]}}>{i.statut}</span></div>
              <div className="truncate text-[11px] text-slate-500">{i.destinataire} · {i.date} — {i.description}</div></div></div>)):
            <p className="text-[12px] italic text-slate-400">Aucune demande d'intervention sur cette sépulture.</p>}
        </Card></div>

        <div ref={el=>refs.current.courriers=el}><Card title="Courriers & échanges" icon={<Mail size={14}/>}>
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <span className="text-[11px] text-slate-500">Produire un document :</span>
            <Sel value={prodType} onChange={e=>setProdType(e.target.value)}>{DOC_TYPES.map(d=><option key={d.k} value={d.k}>{d.nom}</option>)}</Sel>
            <button onClick={produceDoc} className="flex items-center gap-1.5 rounded-md bg-[#CD0947] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90"><FileCheck2 size={14}/>Produire & journaliser</button>
            <label className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[12px] text-slate-700 hover:bg-slate-100"><Paperclip size={14}/>Joindre un scan / e-mail (.msg, .pdf, image)<input type="file" className="hidden" onChange={uploadScan}/></label>
          </div>
          {(rec.courriers||[]).length?<div className="relative ml-1 border-l-2 border-slate-100 pl-4">
            {(rec.courriers||[]).map(c=>(<div key={c.id} className="relative mb-3 last:mb-0">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{background:SENS_COL[c.sens]||"#94A3B8"}}/>
              <div className="flex items-start gap-3">
                {c.attachment&&c.attachment.img?<img src={c.attachment.url} className="h-14 w-20 shrink-0 rounded border border-slate-200 object-cover"/>:
                 c.attachment?<span className="grid h-14 w-20 shrink-0 place-items-center rounded border border-slate-200 bg-slate-50 text-slate-400"><FileText size={18}/></span>:null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{background:SENS_COL[c.sens]||"#94A3B8"}}>{c.sens}</span>
                    <span className="text-[12.5px] font-medium text-slate-800">{c.objet}</span>
                    <span className="font-mono text-[11px] text-slate-400">{c.date}</span>
                  </div>
                  <div className="text-[11.5px] text-slate-500">{c.canal} · {c.type} · {c.statut}{c.attachment?` · ${c.attachment.name}`:""}</div>
                </div>
              </div>
            </div>))}
          </div>:<p className="text-[12px] italic text-slate-400">Aucun échange enregistré.</p>}
          <p className="mt-2 text-[11px] text-slate-400">Chaque document produit et chaque pièce reçue (scan de courrier, fichier .msg) est conservé ici, daté.</p>
        </Card></div>

        <div ref={el=>refs.current.pro=el}><Card title="Prorogations / maintiens" icon={<RotateCcw size={14}/>}>
          {(rec.prorogations||[]).length?(rec.prorogations||[]).map((p,i)=>(<div key={i} className="grid grid-cols-4 gap-x-6 border-t border-slate-100 py-1.5 text-[12px] first:border-0"><span><span className="text-slate-400">Demande </span><span className="font-mono">{p.dateDemande}</span></span><span><span className="text-slate-400">Durée </span>{p.duree}</span><span><span className="text-slate-400">Collège </span>{p.accordCollege}</span><span><span className="text-slate-400">Date </span><span className="font-mono">{p.date}</span></span></div>)):<p className="text-[12px] italic text-slate-400">Aucune prorogation.</p>}
        </Card></div>

        <div ref={el=>refs.current.etat=el}><Card title="État · désaffection · affichages" icon={<AlertTriangle size={14}/>}>
          <div className="grid grid-cols-2 gap-x-8"><div><KV k="Code état" v={(rec.etat||{}).codeEtat}/><KV k="Travaux" v={(rec.etat||{}).travaux}/><KV k="Désaffection" v={(rec.etat||{}).desaffection}/></div><div><KV k="Affichage — début" v={(rec.etat||{}).affichageDebut} mono/><KV k="Affichage — fin" v={(rec.etat||{}).affichageFin} mono/></div></div>
          {(rec.statut==="echue")&&<div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2.5 text-[11.5px] text-red-800"><Clock size={13} className="mr-1 inline"/>Concession échue — relance d'au moins un ayant droit requise (CDLD L1232-12 §2), avant ouverture de la procédure de reprise.</div>}
        </Card></div>

        {rec.sihl&&<div ref={el=>refs.current.sihl=el}><Card title="Patrimoine (SIHL)" icon={<Landmark size={14}/>}>
          <div className="grid grid-cols-2 gap-x-8"><div><KV k="Motif de classement" v={rec.sihl.motif}/><KV k="Catégorie" v={rec.sihl.categorie}/></div><div><KV k="N° inventaire" v={rec.sihl.inventaire} mono/></div></div>
          <p className="mt-2 text-[12px] text-slate-700">{rec.sihl.architecture}</p>
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3"><div className="grid h-16 w-16 place-items-center rounded bg-white"><QrCode size={42} className="text-slate-800"/></div><div className="text-[12px] text-orange-900"><div className="font-semibold">Page mémoire publique</div><div className="opacity-80">QR à apposer → fiche du défunt, du monument et de son histoire.</div></div></div>
        </Card></div>}

        <div ref={el=>refs.current.doc=el}><Card title="Documents" icon={<FileSignature size={14}/>}>
          {(rec.documents||[]).map((dd,i)=>(<div key={i} className="flex items-center justify-between border-t border-slate-100 py-1.5 text-[12px] first:border-0"><span className="flex items-center gap-2 text-slate-700"><FileText size={13} className="text-slate-400"/>{dd.nom}</span><span className="font-mono text-slate-400">{dd.date}</span></div>))}
        </Card></div>

        <div ref={el=>refs.current.notes=el}><Card title="Notes / images terrain" icon={<ImageIcon size={14}/>}>
          <div className="grid grid-cols-2 gap-x-8"><div><KV k="Monument" v={(rec.notesTerrain||{}).monument}/><KV k="Épitaphes" v={(rec.notesTerrain||{}).epitaphes}/></div><div><KV k="État" v={(rec.notesTerrain||{}).etat}/><KV k="Réparation" v={(rec.notesTerrain||{}).reparation}/></div></div>
        </Card></div>

        <div ref={el=>refs.current.hist=el}><Card title="Historique des modifications" icon={<History size={14}/>}>
          <table className="w-full text-[12px]"><thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-slate-400"><th className="py-1">Date</th><th>Encodeur</th><th>Action</th><th>Statut</th></tr></thead>
          <tbody>{(rec.historique||[]).map((h,i)=>(<tr key={i} className="border-t border-slate-100"><td className="py-1.5 font-mono text-slate-500">{h.date}</td><td className="text-slate-700">{h.encodeur}</td><td className="text-slate-700">{h.action}</td><td><span className={h.statut==="Validé"?"text-green-600":"text-amber-600"}>{h.statut}</span></td></tr>))}</tbody></table>
        </Card></div>

        <div className="flex gap-2 pb-6">
          <button onClick={()=>setEdit(true)} className="rounded-md bg-slate-800 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-700">Modifier le dossier</button>
          <button onClick={()=>{toast("Impression de la fiche…");window.print();}} className="rounded-md border border-slate-300 px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-100">Imprimer la fiche</button>
          {archived?<button onClick={remettreEnVente} className="ml-auto flex items-center gap-1.5 rounded-md bg-violet-700 px-4 py-2 text-[13px] font-medium text-white hover:bg-violet-800"><RotateCcw size={15}/>Remettre en vente</button>
            :<button onClick={archiver} className="ml-auto flex items-center gap-1.5 rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-[13px] font-medium text-violet-800 hover:bg-violet-100"><Archive size={15}/>Archiver (abandon famille)</button>}
        </div>
        {edit&&<EditDossierModal rec={rec} onClose={()=>setEdit(false)} onSave={(f)=>{setRec(r=>({
          ...r,denom1:f.denom1,denom2:f.denom2,nature:f.nature,statut:f.statut,duree:f.duree,octroi:f.octroi,expiration:f.expiration,derniereInhum:f.derniereInhum,observations:f.observations,
          typeOuverture:f.typeOuverture,modeOuverture:f.modeOuverture,longueur:f.longueur,largeur:f.largeur,profondeur:f.profondeur,
          placesTot:+f.placesTot||r.placesTot,placesOcc:+f.placesOcc||r.placesOcc,placesDisp:Math.max(0,(+f.placesTot||r.placesTot)-(+f.placesOcc||r.placesOcc)),
          monument:r.monument?{...r.monument,type:f.monType,materiau:f.monMat,etat:f.monEtat}:r.monument,
          etat:{...r.etat,codeEtat:f.etatCode,desaffection:f.desaffection},
          personnes:{...r.personnes,responsable:[{...(r.personnes.responsable[0]||{}),nom:f.conc,nn:f.concNN,adresse:f.concAdr}],concessionnaire:(r.personnes.concessionnaire&&r.personnes.concessionnaire.length)?[{...(r.personnes.concessionnaire[0]||{}),nom:f.conc,nn:f.concNN,adresse:f.concAdr}]:r.personnes.concessionnaire},
        }));setEdit(false);toast("Dossier modifié");}}/>}
        {ivOpen&&<InterventionModal initRef={rec.ref} records={{[rec.ref]:rec}} onClose={()=>setIvOpen(false)} onCreate={iv=>{onAddIntervention&&onAddIntervention(iv);setIvOpen(false);toast("Demande d'intervention créée");}}/>}
      </div>
    </div>
  </div>);
}
function SECTIONS_FILTER(rec){return SECTIONS.filter(([k])=>k!=="sihl"||rec.sihl);}
const PersonGroup=({title,people})=>(!people?.length?null:(
  <div className="mb-2 last:mb-0"><p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{title}</p>
    <div className="space-y-1">{people.map((p,i)=>(<div key={i} className="rounded-md bg-slate-50 p-2 text-[12px]"><div className="flex items-center justify-between"><span className="font-medium text-slate-800">{p.nom}</span>{p.parente&&<span className="text-[11px] text-slate-500">{p.parente}</span>}</div>{(p.nn||p.lieu||p.naissance)&&<div className="font-mono text-[10.5px] text-slate-500">{[p.nn&&("NN "+p.nn),p.lieu,p.naissance].filter(Boolean).join(" · ")}</div>}{p.adresse&&<div className="text-[11px] text-slate-500">{p.adresse}</div>}</div>))}</div></div>));

/* ---------- liste concessions ---------- */
function CreateConcession({onClose,onCreate}){
  const [f,setF]=useState({ref:"",cimetiere:"Belgrade",nature:"caveau",statut:"occupe",denom1:"",denom2:"",duree:"30 ans",octroi:"2026",expiration:"2056",placesTot:"2",conc:"",nn:"",adresse:""});
  const up=(k,v)=>setF(s=>({...s,[k]:v}));
  const submit=()=>{
    const ref=f.ref||("N"+Math.floor(Math.random()*900+100)+"/T"+Math.floor(Math.random()*90+1));
    const base=buildRecord({ref,nature:f.nature,statut:f.statut});
    const tot=+f.placesTot||base.placesTot;
    const resp={...(base.personnes.responsable[0]||{}),nom:f.conc||base.personnes.responsable[0]?.nom,nn:f.nn||base.personnes.responsable[0]?.nn,adresse:f.adresse||base.personnes.responsable[0]?.adresse};
    const rec={...base,ref,cimetiere:f.cimetiere,nature:f.nature,statut:f.statut,
      denom1:f.denom1||`Famille ${(f.conc||"NOUVELLE").toUpperCase()}`,denom2:f.denom2,duree:f.duree,octroi:f.octroi,expiration:f.expiration,
      placesTot:tot,placesDisp:Math.max(0,tot-base.placesOcc),
      personnes:{...base.personnes,responsable:[resp],concessionnaire:[resp]}};
    onCreate(rec);
  };
  return(<div className="fixed inset-0 z-[9998] grid place-items-center bg-black/30 p-4" onClick={onClose}>
    <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl" onClick={e=>e.stopPropagation()}>
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3"><span className="flex items-center gap-2 text-[13.5px] font-semibold text-slate-800"><FilePlus size={16} className="text-[#CD0947]"/>Créer une nouvelle concession</span><button onClick={onClose}><X size={18} className="text-slate-400"/></button></div>
      <div className="p-4">
        <Sub>Identité de la concession</Sub><Grid3>
          <Field label="Référence (allée/n°)"><Inp value={f.ref} onChange={e=>up("ref",e.target.value)} placeholder="auto si vide — ex. ALM/T31"/></Field>
          <Field label="Cimetière"><Sel value={f.cimetiere} onChange={e=>up("cimetiere",e.target.value)}><option>Belgrade</option><option>Saint-Servais</option><option>Bouge</option></Sel></Field>
          <Field label="Nature"><Sel value={f.nature} onChange={e=>up("nature",e.target.value)}>{Object.entries(NATURES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</Sel></Field>
          <Field label="Statut"><Sel value={f.statut} onChange={e=>up("statut",e.target.value)}>{Object.entries(STATUTS).filter(([k])=>k!=="libre").map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</Sel></Field>
          <Field label="Dénomination (1)"><Inp value={f.denom1} onChange={e=>up("denom1",e.target.value)} placeholder="Famille …"/></Field>
          <Field label="Dénomination (2)"><Inp value={f.denom2} onChange={e=>up("denom2",e.target.value)} placeholder="dite « … »"/></Field>
        </Grid3>
        <Sub>Durée & places</Sub><Grid3>
          <Field label="Durée"><Sel value={f.duree} onChange={e=>up("duree",e.target.value)}><option>15 ans</option><option>30 ans</option><option>50 ans</option><option>Perpétuelle</option><option>Gratuite 30 ans</option></Sel></Field>
          <Field label="Date d'octroi"><Inp value={f.octroi} onChange={e=>up("octroi",e.target.value)}/></Field>
          <Field label="Date d'expiration"><Inp value={f.expiration} onChange={e=>up("expiration",e.target.value)}/></Field>
          <Field label="Nombre de places"><Inp value={f.placesTot} onChange={e=>up("placesTot",e.target.value)}/></Field>
        </Grid3>
        <Sub>Concessionnaire</Sub><Grid3>
          <Field label="Nom & prénom"><Inp value={f.conc} onChange={e=>up("conc",e.target.value)} placeholder="DUPONT Jean"/></Field>
          <Field label="N° national"><Inp value={f.nn} onChange={e=>up("nn",e.target.value)}/></Field>
          <Field label="Adresse" full><Inp value={f.adresse} onChange={e=>up("adresse",e.target.value)}/></Field>
        </Grid3>
      </div>
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white px-4 py-3">
        <button onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-[12.5px] text-slate-700 hover:bg-slate-100">Annuler</button>
        <button onClick={submit} className="rounded-md bg-[#CD0947] px-4 py-2 text-[12.5px] font-medium text-white hover:opacity-90">Créer & ouvrir le dossier</button>
      </div>
    </div></div>);
}
function Concessions({onOpen,search,extra,onCreate,defaultCim,onPlan,dbRows}){
  const [create,setCreate]=useState(false);
  const [flt,setFlt]=useState({...FILTER_DEFAULT,cim:defaultCim||"Tous"});
  const [fopen,setFopen]=useState(true);
  useEffect(()=>{setFlt(s=>({...s,cim:defaultCim||"Tous"}));},[defaultCim]);
  const all=Array.isArray(dbRows)
    ? [...Object.values(extra||{}),...dbRows]
    : [...Object.values(extra||{}),...PLOTS.filter(p=>p.statut!=="libre"&&!(extra&&extra[p.ref])).map(p=>RECORDS[p.ref])];
  const sv=(search||"").toLowerCase();
  const rows=all.filter(r=>r&&matchRec(r,flt)&&(!sv||(r.ref+" "+(r.denom1||"")).toLowerCase().includes(sv)));
  const active=filterActive(flt)||search;
  return(<div className="flex h-full flex-col bg-white">
    <div className="flex items-center justify-between border-b border-slate-100 px-5 pt-4 pb-2">
      <div><h2 className="text-[15px] font-semibold text-slate-800">Concessions — Gerpinnes</h2>
        <p className="text-[11.5px] text-slate-500">{rows.length} / {all.length} concessions {Array.isArray(dbRows)?<span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">base de données</span>:null} · cliquez une ligne pour ouvrir le dossier · <span className="inline-flex items-center gap-0.5"><Map size={11}/> pour localiser sur le plan</span></p></div>
      <button onClick={()=>setCreate(true)} className="flex items-center gap-1.5 rounded-md bg-[#CD0947] px-3.5 py-2 text-[12.5px] font-medium text-white hover:opacity-90"><FilePlus size={15}/>Créer une concession</button>
    </div>
    <div className="border-b border-slate-200 bg-slate-50 px-5 py-2">
      <button onClick={()=>setFopen(!fopen)} className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400"><Filter size={13}/>Filtres & recherche {fopen?<ChevronDown size={13}/>:<ChevronRight size={13}/>}</button>
      {fopen&&<div className="flex flex-wrap items-center gap-2">
        <FilterFields val={flt} setVal={setFlt}/>
        {active&&<button onClick={()=>setFlt({...FILTER_DEFAULT,cim:defaultCim||"Tous"})} className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[11.5px] text-slate-600 hover:bg-slate-100">Réinitialiser</button>}
      </div>}
    </div>
    <div className="min-h-0 flex-1 overflow-auto p-5">
    <table className="w-full border-collapse text-[12px]"><thead><tr className="border-b border-slate-200 text-left text-[10.5px] uppercase tracking-wide text-slate-400">
      {["Réf.","Cimetière","Nature","Statut","Dénomination","Octroi","Échéance","Places","Resp.",""].map(h=><th key={h} className="px-2 py-2">{h}</th>)}</tr></thead>
      <tbody>{rows.slice(0,150).map(r=>{const nat=r.nature?NATURES[r.nature]:null;const st=STATUTS[r.statut]||{label:r.statut||"—",ring:"#64748B"};return(
        <tr key={r.ref} onClick={()=>onOpen(r.ref)} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50">
          <td className="px-2 py-1.5 font-mono font-medium text-slate-800">{r.ref}</td>
          <td className="px-2 py-1.5 text-slate-600">{r.cimetiere}</td>
          <td className="px-2 py-1.5">{nat&&<span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{background:nat.color}}/>{nat.label}</span>}</td>
          <td className="px-2 py-1.5" style={{color:st.ring}}>{st.label}</td>
          <td className="px-2 py-1.5 text-slate-700">{r.denom1}</td>
          <td className="px-2 py-1.5 font-mono text-slate-500">{r.octroi}</td>
          <td className="px-2 py-1.5 font-mono text-slate-500">{r.expiration}</td>
          <td className="px-2 py-1.5 font-mono text-slate-500">{r.placesOcc}/{r.placesTot}</td>
          <td className="px-2 py-1.5 text-slate-600">{r.personnes.responsable[0]?.nom}</td>
          <td className="px-2 py-1.5 text-right"><button onClick={e=>{e.stopPropagation();onPlan&&onPlan(r.ref);}} title="Localiser sur le plan" className="inline-grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-500 hover:border-[#CD0947]/40 hover:text-[#CD0947]"><Map size={14}/></button></td>
        </tr>);})}</tbody></table>
      {rows.length===0&&<p className="p-6 text-center text-[12px] italic text-slate-400">Aucune concession ne correspond aux filtres.</p>}
    </div>
    {create&&<CreateConcession onClose={()=>setCreate(false)} onCreate={(rec)=>{setCreate(false);onCreate(rec);}}/>}
  </div>);
}

/* ---------- REPRISES (workflow état d'abandon) ---------- */
const PHASES=["Constat d'abandon","Affichage (1 an)","2ᵉ constat / PV","Décision du collège","Reprise effective"];
function Reprises({onOpen,onDelib}){
  const list=PLOTS.filter(p=>p.statut==="echue"||p.statut==="reprise").map(p=>RECORDS[p.ref]).slice(0,8);
  const [sel,setSel]=useState(list[0]?.ref);
  const cur=RECORDS[sel];
  const phaseIdx=cur?.statut==="reprise"?3:1;
  return(<div className="flex h-full bg-slate-50">
    <div className="w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3">
      <h2 className="px-1 text-[14px] font-semibold text-slate-800">Procédures de reprise</h2>
      <p className="mb-2 px-1 text-[11px] text-slate-500">État d'abandon · CDLD L1232-12</p>
      {list.map(r=>(<button key={r.ref} onClick={()=>setSel(r.ref)} className={`mb-1 w-full rounded-md border p-2 text-left ${sel===r.ref?"border-slate-800 bg-slate-50":"border-slate-200 hover:bg-slate-50"}`}>
        <div className="flex items-center justify-between"><span className="font-mono text-[12px] font-semibold">{r.ref}</span><span className="text-[10.5px]" style={{color:(STATUTS[r.statut]||{ring:"#64748B"}).ring}}>{(STATUTS[r.statut]||{label:r.statut}).label}</span></div>
        <div className="truncate text-[11px] text-slate-500">{r.denom1}</div></button>))}
    </div>
    <div className="min-w-0 flex-1 overflow-y-auto p-6">
      {cur&&<div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div><div className="font-mono text-[16px] font-semibold text-slate-900">{cur.ref}</div><div className="text-[12.5px] text-slate-600">{cur.denom1}</div></div>
          <button onClick={()=>onOpen(cur.ref)} className="rounded-md border border-slate-300 px-3 py-1.5 text-[12px] text-slate-700 hover:bg-white">Ouvrir le dossier</button>
        </div>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <p className="mb-4 text-[13px] font-semibold text-slate-700">Déroulé de la procédure</p>
          <ol className="relative ml-3 border-l-2 border-slate-200">
            {PHASES.map((ph,i)=>{const done=i<phaseIdx,active=i===phaseIdx;return(
              <li key={i} className="mb-5 ml-5 last:mb-0">
                <span className="absolute -left-[9px] grid h-4 w-4 place-items-center rounded-full" style={{background:done?"#2E971F":active?"#E08E33":"#fff",border:done||active?"none":"2px solid #CBD5E1"}}>
                  {done&&<CheckCircle2 size={14} className="text-white"/>}</span>
                <div className={`text-[13px] ${done?"text-slate-800 font-medium":active?"text-amber-700 font-medium":"text-slate-400"}`}>{ph}</div>
                <div className="text-[11px] text-slate-400">{i===0?`Constaté le ${cur.etat.affichageDebut}`:i===1?`Affiché du ${cur.etat.affichageDebut} au ${cur.etat.affichageFin}`:active?"En cours — action requise":done?"Terminé":"À venir"}</div>
              </li>);})}
          </ol>
          <div className="mt-2 flex gap-2">
            <button onClick={()=>toast("PV de constat généré")} className="rounded-md bg-slate-800 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-slate-700">Générer le PV</button>
            <button onClick={()=>toast("Avis d'affichage édité")} className="rounded-md border border-slate-300 px-3 py-1.5 text-[12px] text-slate-700 hover:bg-slate-50">Éditer l'affichage</button>
            <button onClick={()=>toast("Ayant droit notifié par courrier")} className="rounded-md border border-slate-300 px-3 py-1.5 text-[12px] text-slate-700 hover:bg-slate-50">Notifier l'ayant droit</button>
            <button onClick={()=>onDelib&&onDelib({extId:"CIM/REP/"+(cur.ref||"").replace(/\//g,"-"),objet:"Reprise de la concession "+cur.ref+" (état d'abandon — CDLD L1232-12)",type:"meeting-config-council",cat:"Cimetières — reprises (décision)",proposition:"Le Conseil communal décide de reprendre la concession "+cur.ref+" («\u00a0"+(cur.denom1||"")+"\u00a0»), échue et constatée en état d'abandon après la procédure d'affichage réglementaire, conformément aux articles L1232-12 et suivants du CDLD."})} className="flex items-center gap-1.5 rounded-md bg-[#15324a] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90"><Gavel size={14}/>Inscrire au Conseil (iA.Délib)</button>
          </div>
        </div>
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-[11.5px] text-slate-600"><ScrollText size={13} className="mr-1 inline"/>Délai de carence : 1 an d'affichage après échéance. La reprise n'est effective qu'après décision du collège communal.</div>
      </div>}
    </div></div>);
}

/* ---------- FACTURATION ---------- */
function Facturation({extra=[]}){
  const base=[
    {ref:"ALM/T4",type:"Concession 30 ans",debiteur:"Mme Pastur",montant:"750 €",statut:"Payée",c:"#2E971F"},
    {ref:"BRT/T2",type:"Renouvellement 30 ans",debiteur:"M. Lambert",montant:"1 250 €",statut:"À échoir",c:"#E08E33"},
    {ref:"CHE/T3",type:"Redevance caveau (annuelle)",debiteur:"Famille Renard",montant:"50 €",statut:"Impayée",c:"#C0392B"},
    {ref:"DUM/T1",type:"Autorisation travaux marbrier",debiteur:"Marbrerie Dubois",montant:"35 €",statut:"Payée",c:"#2E971F"},
    {ref:"BRT/T9",type:"Cellule columbarium 15 ans",debiteur:"M. Henry",montant:"450 €",statut:"Payée",c:"#2E971F"},
    {ref:"ALM/T12",type:"Concession 50 ans",debiteur:"Famille Collin",montant:"1 100 €",statut:"À échoir",c:"#E08E33"},
  ];
  const items=[...extra,...base];
  const num=s=>parseInt((""+s).replace(/[^\d]/g,""))||0;
  const sum=f=>items.filter(f).reduce((a,it)=>a+num(it.montant),0).toLocaleString("fr-BE")+" €";
  return(<div className="h-full overflow-y-auto bg-slate-50 p-6">
    <h2 className="text-[15px] font-semibold text-slate-800">Facturation & redevances</h2>
    <p className="text-[12px] text-slate-500">Concessions, renouvellements, redevances, autorisations, funérailles — export vers la facturation communale.</p>
    <div className="mt-4 grid grid-cols-3 gap-3">
      <Kpi label="Émis (exercice)" value={sum(()=>true)} color="#334155"/><Kpi label="À échoir" value={sum(it=>it.statut==="À échoir")} color="#E08E33"/><Kpi label="Impayés" value={sum(it=>it.statut==="Impayée")} color="#C0392B"/>
    </div>
    <div className="mt-4 rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-[12px]"><thead><tr className="border-b border-slate-200 text-left text-[10.5px] uppercase tracking-wide text-slate-400">
        {["Réf.","Objet","Débiteur","Montant","Statut",""].map(h=><th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
        <tbody>{items.map((it,i)=>(<tr key={i} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i<extra.length?"bg-emerald-50/40":""}`}>
          <td className="px-3 py-2 font-mono font-medium text-slate-800">{it.ref}{i<extra.length&&<span className="ml-1 rounded bg-emerald-100 px-1 text-[9px] text-emerald-700">décès</span>}</td><td className="px-3 py-2 text-slate-700">{it.type}</td>
          <td className="px-3 py-2 text-slate-600">{it.debiteur}</td><td className="px-3 py-2 font-mono font-medium text-slate-800">{it.montant}</td>
          <td className="px-3 py-2"><span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{background:it.c+"1A",color:it.c}}>{it.statut}</span></td>
          <td className="px-3 py-2 text-right"><button onClick={()=>toast("Facture "+it.ref+" ouverte en édition")} className="text-[11px] text-slate-500 hover:text-slate-800">Éditer</button></td></tr>))}</tbody></table>
    </div></div>);
}
const Kpi=({label,value,color})=>(<div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-[24px] font-semibold" style={{color}}>{value}</div><div className="text-[12px] text-slate-600">{label}</div></div>);

/* ---------- CONFIGURATION COMMUNALE ---------- */
function Configuration(){
  const [tab,setTab]=useState("tarifs");
  const [tarifs,setTarifs]=useState(TARIFS.map(t=>({...t})));
  const [durees,setDurees]=useState([{label:"15 ans",annees:"15",gratuit:"Non"},{label:"30 ans",annees:"30",gratuit:"Non"},{label:"50 ans",annees:"50",gratuit:"Non"},{label:"Perpétuelle",annees:"—",gratuit:"Non"},{label:"Parcelle des étoiles",annees:"30",gratuit:"Oui"}]);
  const [taxes,setTaxes]=useState([{lib:"Taxe d'inhumation",montant:"100 €"},{lib:"Taxe d'exhumation",montant:"250 €"},{lib:"Ouverture de caveau",montant:"75 €"},{lib:"Dispersion des cendres",montant:"60 €"},{lib:"Plaquette commémorative",montant:"45 €"},{lib:"Cellule d'attente (par sem.)",montant:"20 €"}]);
  const [regles,setRegles]=useState(REGLES.map(r=>({...r})));
  const tabs=[["tarifs","Tarifs des concessions"],["durees","Durées"],["taxes","Taxes & redevances"],["regles","Règles & délais"]];
  const upd=(arr,set,i,k,v)=>set(arr.map((row,j)=>j===i?{...row,[k]:v}:row));
  const del=(arr,set,i)=>set(arr.filter((_,j)=>j!==i));
  const Cell=({v,on,mono})=><input value={v} onChange={e=>on(e.target.value)} className={`w-full rounded border border-transparent px-1.5 py-1 text-[12px] outline-none hover:border-slate-200 focus:border-[#CD0947]/50 focus:bg-white ${mono?"font-mono text-slate-600":"text-slate-700"}`}/>;
  const Trash=({on})=><button onClick={on} className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500"><Trash2 size={14}/></button>;
  const AddBtn=({on,label})=><button onClick={on} className="mt-2 flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-[12px] text-slate-500 hover:border-[#CD0947]/40 hover:text-[#CD0947]"><Plus size={14}/>{label}</button>;
  return(<div className="flex h-full flex-col bg-slate-50">
    <div className="flex items-end justify-between border-b border-slate-200 bg-white px-5 pt-3">
      <div className="flex gap-1 text-[12.5px]">{tabs.map(([k,l])=><button key={k} onClick={()=>setTab(k)} className={`rounded-t-md px-3 py-2 ${tab===k?"border-b-2 border-[#CD0947] font-semibold text-slate-900":"text-slate-500 hover:text-slate-700"}`}>{l}</button>)}</div>
      <button onClick={()=>toast("Paramètres enregistrés")} className="mb-1.5 flex items-center gap-1.5 rounded-md bg-[#CD0947] px-3.5 py-2 text-[12.5px] font-medium text-white hover:opacity-90"><Save size={15}/>Enregistrer</button>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto p-5">
      <p className="mb-3 text-[12px] text-slate-500">Paramètres propres au règlement communal — pilotés par le gestionnaire. Cliquez une valeur pour la modifier.</p>

      {tab==="tarifs"&&<div className="rounded-xl border border-slate-200 bg-white p-1">
        <table className="w-full text-[12px]"><thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-slate-400">{["Nature","15 ans","30 ans","50 ans","Perpétuelle","Redevance",""].map(h=><th key={h} className="px-2 py-2">{h}</th>)}</tr></thead>
          <tbody>{tarifs.map((t,i)=>(<tr key={i} className="border-t border-slate-100">
            <td className="px-1"><Cell v={t.nature} on={v=>upd(tarifs,setTarifs,i,"nature",v)}/></td>
            <td className="px-1"><Cell mono v={t.d15} on={v=>upd(tarifs,setTarifs,i,"d15",v)}/></td>
            <td className="px-1"><Cell mono v={t.d30} on={v=>upd(tarifs,setTarifs,i,"d30",v)}/></td>
            <td className="px-1"><Cell mono v={t.d50} on={v=>upd(tarifs,setTarifs,i,"d50",v)}/></td>
            <td className="px-1"><Cell mono v={t.perp} on={v=>upd(tarifs,setTarifs,i,"perp",v)}/></td>
            <td className="px-1"><Cell v={t.redevance} on={v=>upd(tarifs,setTarifs,i,"redevance",v)}/></td>
            <td className="px-1 text-right"><Trash on={()=>del(tarifs,setTarifs,i)}/></td></tr>))}</tbody></table>
        <div className="px-2 pb-2"><AddBtn label="Ajouter une ligne tarifaire" on={()=>setTarifs(a=>[...a,{nature:"Nouvelle nature",d15:"—",d30:"—",d50:"—",perp:"—",redevance:"—"}])}/></div>
      </div>}

      {tab==="durees"&&<div className="rounded-xl border border-slate-200 bg-white p-1">
        <table className="w-full text-[12px]"><thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-slate-400">{["Libellé","Années","Gratuite",""].map(h=><th key={h} className="px-2 py-2">{h}</th>)}</tr></thead>
          <tbody>{durees.map((d,i)=>(<tr key={i} className="border-t border-slate-100">
            <td className="px-1"><Cell v={d.label} on={v=>upd(durees,setDurees,i,"label",v)}/></td>
            <td className="px-1"><Cell mono v={d.annees} on={v=>upd(durees,setDurees,i,"annees",v)}/></td>
            <td className="px-1"><Cell v={d.gratuit} on={v=>upd(durees,setDurees,i,"gratuit",v)}/></td>
            <td className="px-1 text-right"><Trash on={()=>del(durees,setDurees,i)}/></td></tr>))}</tbody></table>
        <div className="px-2 pb-2"><AddBtn label="Ajouter une durée" on={()=>setDurees(a=>[...a,{label:"Nouvelle durée",annees:"",gratuit:"Non"}])}/></div>
      </div>}

      {tab==="taxes"&&<div className="rounded-xl border border-slate-200 bg-white p-1">
        <table className="w-full text-[12px]"><thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-slate-400">{["Libellé","Montant",""].map(h=><th key={h} className="px-2 py-2">{h}</th>)}</tr></thead>
          <tbody>{taxes.map((t,i)=>(<tr key={i} className="border-t border-slate-100">
            <td className="px-1"><Cell v={t.lib} on={v=>upd(taxes,setTaxes,i,"lib",v)}/></td>
            <td className="px-1"><Cell mono v={t.montant} on={v=>upd(taxes,setTaxes,i,"montant",v)}/></td>
            <td className="px-1 text-right"><Trash on={()=>del(taxes,setTaxes,i)}/></td></tr>))}</tbody></table>
        <div className="px-2 pb-2"><AddBtn label="Ajouter une taxe / redevance" on={()=>setTaxes(a=>[...a,{lib:"Nouvelle taxe",montant:"0 €"}])}/></div>
      </div>}

      {tab==="regles"&&<div className="rounded-xl border border-slate-200 bg-white p-3">
        {regles.map((r,i)=>(<div key={i} className="flex items-center gap-2 border-b border-slate-50 py-1.5 last:border-0">
          <input value={r.k} onChange={e=>upd(regles,setRegles,i,"k",e.target.value)} className="w-64 shrink-0 rounded border border-transparent px-1.5 py-1 text-[12px] font-medium text-slate-700 outline-none hover:border-slate-200 focus:border-[#CD0947]/50 focus:bg-white"/>
          <input value={r.v} onChange={e=>upd(regles,setRegles,i,"v",e.target.value)} className="flex-1 rounded border border-transparent px-1.5 py-1 text-[12px] text-slate-600 outline-none hover:border-slate-200 focus:border-[#CD0947]/50 focus:bg-white"/>
          <Trash on={()=>del(regles,setRegles,i)}/></div>))}
        <AddBtn label="Ajouter une règle" on={()=>setRegles(a=>[...a,{k:"Nouvelle règle",v:""}])}/>
      </div>}
    </div>
  </div>);
}

/* ---------- TABLEAU DE BORD ---------- */
function Dashboard(){
  const plots=PLOTS;const tot=plots.length;
  const occ=plots.filter(p=>["occupe","echue","renouvellement","reprise"].includes(p.statut)).length;
  const libres=plots.filter(p=>p.statut==="libre").length;
  const echues=plots.filter(p=>p.statut==="echue").length;const renouv=plots.filter(p=>p.statut==="renouvellement").length;const repr=plots.filter(p=>p.statut==="reprise").length;
  const kpis=[{l:"Taux d'occupation",v:Math.round(occ/tot*100)+"%",s:`${occ}/${tot} emplacements`,c:"#334155"},{l:"Emplacements libres",v:libres,s:"à l'octroi",c:"#2E971F"},{l:"Concessions échues",v:echues,s:"relance ayant droit",c:"#C0392B"},{l:"En reprise",v:repr,s:"procédure en cours",c:"#7A271A"}];
  const pn=Object.entries(NATURES).map(([k,v])=>({...v,n:plots.filter(p=>p.nature===k).length})).filter(x=>x.n>0).sort((a,b)=>b.n-a.n);const mx=Math.max(...pn.map(x=>x.n));
  return(<div className="h-full overflow-y-auto bg-slate-50 p-6">
    <h2 className="text-[15px] font-semibold text-slate-800">Tableau de bord — Belgrade</h2><p className="text-[12px] text-slate-500">Namur · synthèse en temps réel</p>
    <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{kpis.map(k=>(<div key={k.l} className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-[28px] font-semibold" style={{color:k.c}}>{k.v}</div><div className="mt-1 text-[12.5px] font-medium text-slate-700">{k.l}</div><div className="text-[11px] text-slate-400">{k.s}</div></div>))}</div>
    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="mb-3 text-[13px] font-semibold text-slate-700">Répartition par nature</p>
        <div className="space-y-2">{pn.map(x=>(<div key={x.label} className="flex items-center gap-2"><span className="w-36 shrink-0 text-[12px] text-slate-600">{x.label}</span><div className="h-3 flex-1 rounded bg-slate-100"><div className="h-3 rounded" style={{width:`${x.n/mx*100}%`,background:x.color}}/></div><span className="w-7 text-right font-mono text-[12px] text-slate-500">{x.n}</span></div>))}</div></div>
      <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="mb-3 text-[13px] font-semibold text-slate-700">Échéances réglementaires</p>
        <div className="space-y-2.5 text-[12.5px]">
          <E c="#C0392B" t={`${echues} concessions échues`} s="Relance ayant droit puis reprise"/>
          <E c="#E08E33" t={`${renouv} renouvellements à instruire`} s="Décision collège attendue"/>
          <E c="#7A271A" t={`${repr} procédures de reprise`} s="Affichage en cours"/>
          <E c="#8E7CC3" t="Registre renforcé 2026" s="Conformité avant le 01/11/2026"/>
        </div></div></div></div>);
}
const E=({c,t,s})=>(<div className="flex items-start gap-2.5"><span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{background:c}}/><div><div className="font-medium text-slate-700">{t}</div><div className="text-[11px] text-slate-400">{s}</div></div></div>);

/* ============================================================
   APP
   ============================================================ */
/* ================= QR MÉMORIELS — partenaire FOREVER CONNECTED ================= */
const FC_STORE="https://foreverconnected.store/fr-row";
const FC_PLATFORM="https://qreb.eu";
const FC_PRODUCTS=[
  {id:"myosotis",nom:"Ne-m'oubliez-pas (Myosotis)",cat:"Extérieur — tombe",prix:"99,95 €",slug:"aluminium-qr-code-memorial-plaque-with-forget-me-not-myosotis-design-digital-memorial"},
  {id:"arbre",nom:"Arbre de Vie",cat:"Extérieur — tombe",prix:"99,95 €",slug:"tree-of-life-complete-memorial-package-online-tribute-and-a-qr-plaque"},
  {id:"coquelicots",nom:"Coquelicots rouges",cat:"Extérieur — tombe",prix:"99,95 €",slug:"red-poppies-complete-memorial-package-online-tribute-and-a-qr-plaque"},
  {id:"coeur",nom:"Cœur / Trèfle à quatre feuilles",cat:"Extérieur — tombe",prix:"99,95 €",slug:"aluminium-qr-code-memorial-plaque-online-tribute"},
  {id:"ailes",nom:"Ailes d'ange",cat:"Extérieur — tombe",prix:"99,95 €",slug:"angel-wings-complete-memorial-package-online-tribute-and-a-qr-plaque"},
  {id:"papillon",nom:"Papillon",cat:"Extérieur — tombe",prix:"99,95 €",slug:"butterfly-complete-memorial-package-online-tribute-and-a-qr-plaque"},
  {id:"rose",nom:"Rose unique",cat:"Extérieur — tombe",prix:"99,95 €",slug:"qr-memento-featuring-a-delicate-single-rose"},
  {id:"lavande",nom:"Lavande",cat:"Extérieur — tombe",prix:"99,95 €",slug:"aluminium-qr-code-memorial-plaque-with-lavender-design-digital-memorial"},
  {id:"lumiere",nom:"Lumière & Temps",cat:"Extérieur — tombe",prix:"99,95 €",slug:"light-and-time-complete-memorial-package-online-tribute-and-a-qr-plaque"},
  {id:"pissenlit",nom:"Pissenlit (dent-de-lion)",cat:"Extérieur — tombe",prix:"99,95 €",slug:"dandelion-complete-memorial-package-online-tribute-and-a-qr-medallion-for-the-grave"},
];
const FC_STATUTS={"Commandé":"#E08E33","Expédié":"#3a5aa0","Reçu":"#7C3AED","Activé (page en ligne)":"#2E971F"};
const _fcSlug=r=>(""+(r||"")).replace(/[^A-Za-z0-9]/g,"").toLowerCase()||"demo";
const _fcTribute=r=>`${FC_PLATFORM}/m/${_fcSlug(r)}`;
const SEED_FC=[
  {id:"FC-1",ref:"ALM/T3",defunt:"HUBERT Marcel",produit:"Arbre de Vie",prix:"99,95 €",statut:"Activé (page en ligne)",tribute:_fcTribute("ALM/T3"),email:"famille.hubert@example.be",date:"18/06/2026"},
  {id:"FC-2",ref:"BRT/T4",defunt:"BERTRAND Jeanne",produit:"Coquelicots rouges",prix:"99,95 €",statut:"Commandé",tribute:_fcTribute("BRT/T4"),email:"j.bertrand@example.be",date:"24/06/2026"},
];
function FCOrderModal({src,onClose,onOrder}){
  const [sel,setSel]=useState(FC_PRODUCTS[0].id);
  const [email,setEmail]=useState(src.email||"");
  const p=FC_PRODUCTS.find(x=>x.id===sel)||FC_PRODUCTS[0];
  const tribute=_fcTribute(src.ref);
  const qr=qrDataURL(tribute);
  const order=(openStore)=>{
    onOrder({id:"FC-"+Date.now(),ref:src.ref,defunt:src.defunt||"—",produit:p.nom,prix:p.prix,statut:"Commandé",tribute,email,date:"25/06/2026"});
    if(openStore){try{window.open(`${FC_STORE}/products/${p.slug}`,"_blank","noopener");}catch(e){}}
    onClose();
  };
  return(<div className="fixed inset-0 z-[9998] grid place-items-center bg-black/40 p-4" onClick={onClose}>
    <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-xl bg-white shadow-2xl" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between bg-gradient-to-r from-[#CD0947] to-[#a10838] px-5 py-3 text-white">
        <div className="flex items-center gap-2"><QrCode size={18}/><div><div className="text-[10px] uppercase tracking-wide text-white/70">QR mémoriel — partenaire Forever Connected</div><div className="text-[15px] font-semibold">Commander une plaque QR{src.defunt?` — ${src.defunt}`:""}</div></div></div>
        <button onClick={onClose}><X size={18} className="text-white/80"/></button>
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-[1fr_220px]">
        <div>
          <p className="mb-2 text-[12px] text-slate-600">Chaque pack Forever Connected comprend une <b>plaque ou un médaillon QR résistant aux intempéries</b> (à fixer sur la tombe, la stèle ou le columbarium) et une <b>page d'hommage en ligne</b> que la famille remplit de photos, vidéos et souvenirs.</p>
          <div className="grid max-h-64 grid-cols-2 gap-2 overflow-auto pr-1">
            {FC_PRODUCTS.map(pr=>(<button key={pr.id} onClick={()=>setSel(pr.id)} className={`rounded-lg border p-2 text-left text-[12px] transition ${sel===pr.id?"border-[#CD0947] bg-[#CD0947]/5 ring-1 ring-[#CD0947]":"border-slate-200 hover:border-slate-300"}`}>
              <div className="flex items-center gap-1.5 font-medium text-slate-800"><Heart size={12} className="text-[#CD0947]"/>{pr.nom}</div>
              <div className="mt-0.5 text-[10.5px] text-slate-500">{pr.cat} · {pr.prix}</div>
            </button>))}
          </div>
          <label className="mt-3 block"><span className="mb-1 block text-[11px] font-medium text-slate-500">Courriel de la famille (réception du kit d'activation)</span><Inp value={email} onChange={e=>setEmail(e.target.value)} placeholder="famille@exemple.be"/></label>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Page d'hommage liée</div>
          {qr&&<img src={qr} alt="QR" className="mx-auto my-2 h-32 w-32"/>}
          <a href={tribute} target="_blank" rel="noopener" className="break-all text-[10.5px] text-[#CD0947] hover:underline">{tribute}</a>
          <p className="mt-2 text-[10px] text-slate-400">Le QR définitif (design artistique) est fourni par Forever Connected sur la plaque livrée.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
        <span className="text-[10.5px] text-slate-400">Boutique partenaire (Shopify) — paiement Bancontact/carte, livraison en Belgique. Espace Pro villes & municipalités disponible.</span>
        <div className="flex gap-2">
          <button onClick={()=>order(false)} className="rounded-md border border-slate-300 px-3.5 py-2 text-[12.5px] text-slate-700 hover:bg-slate-100">Enregistrer la demande</button>
          <button onClick={()=>order(true)} className="flex items-center gap-1.5 rounded-md bg-[#CD0947] px-3.5 py-2 text-[12.5px] font-medium text-white hover:opacity-90"><ShoppingCart size={14}/>Commander chez Forever Connected</button>
        </div>
      </div>
    </div></div>);
}
function QRMemorielModule({orders,onQR}){
  return(<div className="h-full overflow-auto bg-slate-50 p-6">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2"><QrCode size={18} className="text-[#CD0947]"/><h2 className="text-[15px] font-semibold text-slate-800">QR mémoriels — Forever Connected</h2></div>
      <div className="flex gap-2">
        <a href={FC_STORE+"/collections/qr-memorial-plaques-graves-headstones"} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[12px] text-slate-700 hover:bg-slate-50"><ExternalLink size={13}/>Boutique partenaire</a>
        <button onClick={()=>onQR&&onQR({ref:"",defunt:""})} className="flex items-center gap-1.5 rounded-md bg-[#CD0947] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90"><ShoppingCart size={14}/>Nouvelle commande</button>
      </div>
    </div>
    <p className="mt-1 max-w-3xl text-[12px] text-slate-500">Plaques et médaillons QR reliés à une page d'hommage en ligne. Les familles commandent depuis le portail public ou la fiche de concession ; la commande est transmise au partenaire Forever Connected (boutique Shopify + plateforme qreb.eu). Configuration dans Paramètres › Forever Connected.</p>
    <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
      {Object.entries(FC_STATUTS).map(([k,c])=><span key={k} className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{background:c+"1A",color:c}}><span className="h-2 w-2 rounded-full" style={{background:c}}/>{k}</span>)}
    </div>
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-[12px]"><thead><tr className="border-b border-slate-200 text-left text-[10.5px] uppercase tracking-wide text-slate-400">
        {["Défunt","Concession","Produit","Statut","Page d'hommage","QR","Commande"].map(h=><th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
        <tbody>{orders.map(o=>(<tr key={o.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
          <td className="px-3 py-2 font-medium text-slate-800">{o.defunt}</td>
          <td className="px-3 py-2 font-mono text-[11px] text-slate-600">{o.ref}</td>
          <td className="px-3 py-2 text-slate-700">{o.produit}<div className="text-[10.5px] text-slate-400">{o.prix}</div></td>
          <td className="px-3 py-2"><span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{background:(FC_STATUTS[o.statut]||"#888")+"1A",color:FC_STATUTS[o.statut]||"#888"}}>{o.statut}</span></td>
          <td className="px-3 py-2"><a href={o.tribute} target="_blank" rel="noopener" className="text-[11px] text-[#CD0947] hover:underline">{o.tribute.replace("https://","")}</a></td>
          <td className="px-3 py-2"><img src={qrDataURL(o.tribute)} alt="QR" className="h-10 w-10"/></td>
          <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{o.date}</td>
        </tr>))}</tbody></table>
    </div>
  </div>);
}
function FCConnector(){
  const [f,setF]=useState({url:FC_STORE,region:"Belgique (EUR)",partner:"D2D3 — partenaire B2B",key:"",platform:FC_PLATFORM});
  const up=(k,v)=>setF(s=>({...s,[k]:v}));
  const Lbl=({children})=>(<label className="mb-1 block text-[11px] font-medium text-slate-500">{children}</label>);
  return(<div className="max-w-2xl space-y-3">
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-600"><QrCode size={14} className="mr-1 inline text-[#CD0947]"/>Partenariat <b>Forever Connected</b> — plaques & médaillons QR reliés à une page d'hommage en ligne (plateforme qreb.eu). Les commandes des familles sont transmises à la boutique partenaire ; l'espace Pro « villes & municipalités » permet les projets patrimoniaux (cimetières « musées à ciel ouvert »).</div>
    <div className="grid gap-3 md:grid-cols-2">
      <div className="md:col-span-2"><Lbl>Boutique partenaire (URL)</Lbl><Inp value={f.url} onChange={e=>up("url",e.target.value)}/></div>
      <div><Lbl>Région / devise</Lbl><Sel value={f.region} onChange={e=>up("region",e.target.value)}><option>Belgique (EUR)</option><option>France (EUR)</option><option>Luxembourg (EUR)</option></Sel></div>
      <div><Lbl>Compte partenaire</Lbl><Inp value={f.partner} onChange={e=>up("partner",e.target.value)}/></div>
      <div><Lbl>Plateforme mémorielle</Lbl><Inp value={f.platform} onChange={e=>up("platform",e.target.value)}/></div>
      <div><Lbl>Clé API / code partenaire (facultatif)</Lbl><Inp type="password" value={f.key} onChange={e=>up("key",e.target.value)} placeholder="reversement / suivi de commande"/></div>
    </div>
    <div className="flex flex-wrap gap-2">
      <a href={FC_STORE+"/collections/qr-memorial-plaques-graves-headstones"} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-slate-700"><ExternalLink size={13}/>Ouvrir la boutique partenaire</a>
      <a href={FC_STORE+"/pages/transforming-cemeteries-into-open-air-museums"} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[12px] text-slate-700 hover:bg-slate-50"><Landmark size={13}/>Espace Pro — villes & municipalités</a>
    </div>
    <p className="text-[10.5px] text-slate-400">Intégration réelle : deep-link produit <span className="font-mono">{FC_STORE}/products/&lt;slug&gt;</span> (panier Shopify pré-rempli) ou API partenaire pour créer la page d'hommage sur <span className="font-mono">qreb.eu</span> et lier le QR à la concession.</p>
  </div>);
}
/* ================= LIAISON iA.DÉLIB (iMio) ================= */
const DELIB_CONFIGS={
  "meeting-config-college":{label:"Collège communal",cats:["Cimetières — concessions","Cimetières — exhumations","Cimetières — reprises","Divers"]},
  "meeting-config-council":{label:"Conseil communal",cats:["Cimetières — règlement & tarifs","Cimetières — reprises (décision)","Divers"]},
};
const DELIB_GROUPS=["Service Population — État civil","Service Cimetières","Service Travaux","Secrétariat communal"];
const DEMO_MEETINGS={
  "meeting-config-college":[{uid:"col-2026-07-01",date:"01/07/2026"},{uid:"col-2026-07-08",date:"08/07/2026"},{uid:"col-2026-07-15",date:"15/07/2026"}],
  "meeting-config-council":[{uid:"con-2026-06-30",date:"30/06/2026"},{uid:"con-2026-08-25",date:"25/08/2026"}],
};
const DELIB_STATUTS={"Brouillon":"#94A3B8","Envoyé":"#3a5aa0","Inscrit (séance)":"#E08E33","Décidé — accepté":"#2E971F","Reporté":"#7C3AED"};
const SEED_DELIBS=[
  {id:"DLB-1",extId:"CIM/REP/BRT-T12",objet:"Reprise de la concession BRT/T12 (état d'abandon — CDLD L1232-12)",type:"meeting-config-council",cat:"Cimetières — reprises (décision)",groupe:"Service Cimetières",meetingDate:"25/08/2026",statut:"Inscrit (séance)",date:"24/06/2026"},
  {id:"DLB-2",extId:"CIM/EXH/DUM-C-01",objet:"Autorisation d'exhumation — concession DUM/C/01",type:"meeting-config-college",cat:"Cimetières — exhumations",groupe:"Service Population — État civil",meetingDate:"01/07/2026",statut:"Envoyé",date:"25/06/2026"},
];
function DelibPushModal({src,onClose,onPush}){
  const [f,setF]=useState({type:src.type||"meeting-config-college",cat:"",groupe:DELIB_GROUPS[1],objet:src.objet||"",proposition:src.proposition||"",meeting:"",extId:src.extId||""});
  const up=(k,v)=>setF(s=>({...s,[k]:v}));
  const cfg=DELIB_CONFIGS[f.type];const meetings=DEMO_MEETINGS[f.type]||[];
  const create=()=>{const m=meetings.find(x=>x.uid===f.meeting);
    onPush({id:"DLB-"+Date.now(),extId:f.extId||"CIM/"+Date.now(),objet:f.objet,type:f.type,cat:f.cat||cfg.cats[0],groupe:f.groupe,meetingDate:m?m.date:"À déterminer",statut:"Envoyé",date:"25/06/2026"});onClose();};
  const Lbl=({children})=>(<label className="mb-1 block text-[11px] font-medium text-slate-500">{children}</label>);
  return(<div className="fixed inset-0 z-[9998] grid place-items-center bg-black/40 p-4" onClick={onClose}>
    <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between bg-[#15324a] px-5 py-3 text-white">
        <div className="flex items-center gap-2"><Gavel size={17} className="text-amber-300"/><div><div className="text-[10px] uppercase tracking-wide text-white/60">Inscrire à l'ordre du jour — iA.Délib (iMio)</div><div className="text-[15px] font-semibold">Nouveau point de délibération</div></div></div>
        <button onClick={onClose}><X size={18} className="text-white/70"/></button>
      </div>
      <div className="grid gap-3 p-5 md:grid-cols-2">
        <div><Lbl>Type de séance</Lbl><Sel value={f.type} onChange={e=>{up("type",e.target.value);up("cat","");up("meeting","");}}>{Object.entries(DELIB_CONFIGS).map(([v,c])=><option key={v} value={v}>{c.label}</option>)}</Sel></div>
        <div><Lbl>Service proposant (proposingGroup)</Lbl><Sel value={f.groupe} onChange={e=>up("groupe",e.target.value)}>{DELIB_GROUPS.map(g=><option key={g}>{g}</option>)}</Sel></div>
        <div className="md:col-span-2"><Lbl>Intitulé du point (title)</Lbl><Inp value={f.objet} onChange={e=>up("objet",e.target.value)}/></div>
        <div className="md:col-span-2"><Lbl>Proposition de décision (description)</Lbl><Txt value={f.proposition} onChange={e=>up("proposition",e.target.value)}/></div>
        <div><Lbl>Catégorie</Lbl><Sel value={f.cat} onChange={e=>up("cat",e.target.value)}><option value="">— choisir —</option>{cfg.cats.map(c=><option key={c}>{c}</option>)}</Sel></div>
        <div><Lbl>Séance souhaitée (preferredMeeting)</Lbl><Sel value={f.meeting} onChange={e=>up("meeting",e.target.value)}><option value="">À déterminer</option>{meetings.map(m=><option key={m.uid} value={m.uid}>{cfg.label} — {m.date}</option>)}</Sel></div>
        <div className="md:col-span-2"><Lbl>Identifiant externe (externalIdentifier)</Lbl><Inp value={f.extId} onChange={e=>up("extId",e.target.value)}/></div>
        <div className="md:col-span-2 flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-[11px] text-slate-500"><Paperclip size={13}/>Le document généré (PV de constat, autorisation, projet de délibération) sera joint en annexe du point.</div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
        <span className="text-[10.5px] text-slate-400">Appel réel : <span className="font-mono">createItem</span> (ws4pm) ou POST <span className="font-mono">@item</span> (plonemeeting.restapi).</span>
        <div className="flex gap-2"><button onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-[12.5px] text-slate-700 hover:bg-slate-100">Annuler</button>
        <button onClick={create} disabled={!f.objet} className="flex items-center gap-1.5 rounded-md bg-[#CD0947] px-4 py-2 text-[12.5px] font-medium text-white hover:opacity-90 disabled:opacity-50"><Send size={14}/>Créer le point dans iA.Délib</button></div>
      </div>
    </div></div>);
}
function DelibModule({delibs}){
  return(<div className="h-full overflow-auto bg-slate-50 p-6">
    <div className="flex items-center gap-2"><Gavel size={18} className="text-[#CD0947]"/><h2 className="text-[15px] font-semibold text-slate-800">Délibérations — liaison iA.Délib (iMio)</h2></div>
    <p className="mt-1 max-w-3xl text-[12px] text-slate-500">Points envoyés à l'ordre du jour du Collège / Conseil communal via les Web Services PloneMeeting (createItem). Reprises, exhumations, règlements et tarifs sont poussés directement depuis CIMSYSTEM. Configuration dans Paramètres › iA.Délib.</p>
    <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
      {Object.entries(DELIB_STATUTS).map(([k,c])=><span key={k} className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{background:c+"1A",color:c}}><span className="h-2 w-2 rounded-full" style={{background:c}}/>{k}</span>)}
    </div>
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-[12px]"><thead><tr className="border-b border-slate-200 text-left text-[10.5px] uppercase tracking-wide text-slate-400">
        {["Identifiant externe","Objet du point","Séance","Catégorie","Statut","Envoi"].map(h=><th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
        <tbody>{delibs.map(d=>(<tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
          <td className="px-3 py-2 font-mono text-[11px] text-slate-600">{d.extId}</td>
          <td className="px-3 py-2 text-slate-800">{d.objet}</td>
          <td className="px-3 py-2 text-slate-600">{DELIB_CONFIGS[d.type].label}<div className="font-mono text-[10.5px] text-slate-400">{d.meetingDate}</div></td>
          <td className="px-3 py-2 text-slate-600">{d.cat}</td>
          <td className="px-3 py-2"><span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{background:(DELIB_STATUTS[d.statut]||"#888")+"1A",color:DELIB_STATUTS[d.statut]||"#888"}}>{d.statut}</span></td>
          <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{d.date}</td>
        </tr>))}</tbody></table>
    </div>
  </div>);
}
function DelibConnector(){
  const [f,setF]=useState({url:"https://namur-pm.imio-app.be",mode:"rest",user:"wsmanager",pwd:"",config:"meeting-config-college"});
  const [st,setSt]=useState(null);
  const up=(k,v)=>setF(s=>({...s,[k]:v}));
  const test=()=>{setSt("loading");setTimeout(()=>setSt("ok"),700);};
  const Lbl=({children})=>(<label className="mb-1 block text-[11px] font-medium text-slate-500">{children}</label>);
  return(<div className="max-w-2xl space-y-3">
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-600"><Gavel size={14} className="mr-1 inline text-[#CD0947]"/>Liaison vers <b>iA.Délib</b> (iMio) — points de délibération créés via les Web Services PloneMeeting : <span className="font-mono text-[11px]">ws4pm.wsdl</span> (SOAP) ou <span className="font-mono text-[11px]">plonemeeting.restapi</span> (REST/JSON).</div>
    <div className="grid gap-3 md:grid-cols-2">
      <div className="md:col-span-2"><Lbl>URL iA.Délib (PloneMeeting)</Lbl><Inp value={f.url} onChange={e=>up("url",e.target.value)} placeholder="https://votrecommune-pm.imio-app.be"/></div>
      <div><Lbl>Protocole</Lbl><Sel value={f.mode} onChange={e=>up("mode",e.target.value)}><option value="rest">REST / JSON (plonemeeting.restapi)</option><option value="soap">SOAP / WSDL (ws4pm)</option></Sel></div>
      <div><Lbl>Configuration par défaut</Lbl><Sel value={f.config} onChange={e=>up("config",e.target.value)}>{Object.entries(DELIB_CONFIGS).map(([v,c])=><option key={v} value={v}>{c.label} ({v})</option>)}</Sel></div>
      <div><Lbl>Utilisateur (rôle MeetingManager)</Lbl><Inp value={f.user} onChange={e=>up("user",e.target.value)}/></div>
      <div><Lbl>Mot de passe</Lbl><Inp type="password" value={f.pwd} onChange={e=>up("pwd",e.target.value)}/></div>
    </div>
    <div className="flex items-center gap-2">
      <button onClick={test} className="flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-slate-700"><ShieldCheck size={14}/>Tester la connexion</button>
      {st==="loading"&&<span className="text-[12px] text-slate-400">Connexion…</span>}
      {st==="ok"&&<span className="text-[12px] text-emerald-600">✓ Connecté — {f.mode==="rest"?"@infos":"testConnection"} OK (démo)</span>}
    </div>
    <p className="text-[10.5px] text-slate-400">REST : <span className="font-mono">GET {f.url}/@infos</span>, <span className="font-mono">GET …/@search?config_id={f.config}&meetings_accepting_items=true</span>, <span className="font-mono">POST …/@item</span>. SOAP : <span className="font-mono">{f.url}/ws4pm.wsdl</span> → testConnection / getConfigInfos / createItem.</p>
  </div>);
}
const MODULES=[
  ["dashboard","Tableau de bord",<LayoutDashboard size={17}/>],
  ["plan","Plan",<Map size={17}/>],
  ["concessions","Concessions",<Table2 size={17}/>],
  ["deces","Décès",<ClipboardList size={17}/>],
  ["marbriers","Marbriers",<Hammer size={17}/>],
  ["documents","Documents",<FileCheck2 size={17}/>],
  ["exhumations","Exhumations",<Skull size={17}/>],
  ["reprises","Reprises",<RotateCcw size={17}/>],
  ["delib","Délibérations (iMio)",<Gavel size={17}/>],
  ["qrmemo","QR mémoriels (Forever Connected)",<QrCode size={17}/>],
  ["calendrier","Calendrier",<CalendarDays size={17}/>],
  ["demandes","Demandes",<Inbox size={17}/>],
  ["patrimoine","Patrimoine",<Landmark size={17}/>],
  ["facturation","Facturation",<Receipt size={17}/>],
  ["public","Portail public",<Globe size={17}/>],
  ["config","Configuration",<Settings size={17}/>],
  ["interventions","Interventions",<Wrench size={17}/>],
  ["reprise","Reprise / Import",<Upload size={17}/>],
  ["openmap","OpenMap (public)",<Globe size={17}/>],
  ["params","Paramètres",<UserCog size={17}/>],
];
function Demandes(){const items=[
  {type:"Permis d'inhumer",who:"PF Lebrun",ref:"ALM/T9",date:"Jeu. 26/06 · 10h00",f:"Éq. Nord",s:"À traiter",c:"#E08E33"},
  {type:"Autorisation travaux (marbrier)",who:"Marbrerie Dubois",ref:"BRT/T3",date:"Ven. 27/06",f:"—",s:"Validée",c:"#2E971F"},
  {type:"Permis d'inhumer",who:"PF Gérard",ref:"CHE/T11",date:"Lun. 30/06 · 14h00",f:"Éq. Sud",s:"À traiter",c:"#E08E33"},
  {type:"Renouvellement de concession",who:"M. Lambert",ref:"DUM/T2",date:"—",f:"—",s:"Collège",c:"#1D48CC"},
  {type:"Demande d'exhumation (confort)",who:"Famille Henry",ref:"CHE/T7",date:"À planifier",f:"Éq. centrale",s:"Instruction",c:"#7A271A"},
];return(<div className="h-full overflow-y-auto bg-slate-50 p-6"><h2 className="text-[15px] font-semibold text-slate-800">Demandes & calendrier partagé</h2><p className="text-[12px] text-slate-500">PF, marbriers, fossoyeurs — flux dématérialisé (CDLD L1232-22).</p>
  <div className="mt-4 space-y-2">{items.map((it,i)=>(<div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"><div className="grid h-9 w-9 place-items-center rounded-md bg-slate-100 text-slate-500"><Inbox size={16}/></div><div className="flex-1"><div className="text-[13px] font-medium text-slate-800">{it.type}</div><div className="text-[11.5px] text-slate-500">{it.who} · <span className="font-mono">{it.ref}</span> · {it.date}{it.f!=="—"?` · ${it.f}`:""}</div></div><span className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{background:it.c+"1A",color:it.c}}>{it.s}</span><ChevronRight size={16} className="text-slate-300"/></div>))}</div></div>);}

/* ---------- identité D2D3 + barre d'outils ---------- */
const LOGO=(typeof window!=="undefined"&&window.__D2D3_LOGO__)||"";
function D2D3Logo({className}){
  return LOGO
    ? <img src={LOGO} alt="D2D3" className={className||"h-8 w-auto"}/>
    : <div className="text-[18px] font-black tracking-tight text-[#CD0947]">D2<span className="text-slate-700">D3</span></div>;
}
function CimToolbar(){
  const tools=[
    [<HelpCircle size={15}/>,"Demande d'informations"],[<ListChecks size={15}/>,"Listes"],
    [<Bookmark size={15}/>,"Signets"],[<Layers size={15}/>,"Couches"],
    [<MousePointer2 size={15}/>,"Sélectionner"],[<SquarePen size={15}/>,"Éditer"],
    [<Info size={15}/>,"Informations"],[<Save size={15}/>,"Enregistrer"],
    [<ZoomIn size={15}/>,"Zoomer"],[<ZoomOut size={15}/>,"Dézoomer"],[<Maximize size={15}/>,"Plein écran"],
    [<Printer size={15}/>,"Imprimer"],[<Camera size={15}/>,"Capture"],[<Ruler size={15}/>,"Mesurer"],
  ];
  return(<div className="flex items-center gap-1 overflow-x-auto">
    {tools.map(([i,l],k)=><button key={k} title={l} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/40 text-white hover:bg-white/20">{i}</button>)}
  </div>);
}

/* ---------- CALENDRIER FOSSOYEURS ---------- */
/* ---------- AGENDA (calendrier complet) ---------- */
const CTYPES={
  inhumation:{l:"Inhumation",c:"#1D48CC"},cremation:{l:"Crémation",c:"#0E7490"},
  exhumation:{l:"Exhumation",c:"#7A271A"},dispersion:{l:"Dispersion",c:"#2E971F"},
  travaux:{l:"Travaux marbrier",c:"#E08E33"},ceremonie:{l:"Cérémonie",c:"#7C3AED"},
  entretien:{l:"Entretien",c:"#0F766E"},
};
const CAL_CIMS=["Belgrade","Bouge","Saint-Servais","Jambes","Bomel"];
const pad2=n=>String(n).padStart(2,"0");
const ymd=d=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
const startOfWeek=d=>addDays(d,-((d.getDay()+6)%7));
const sameDay=(a,b)=>ymd(a)===ymd(b);
const toMin=t=>{const[h,m]=t.split(":").map(Number);return h*60+m;};
function evOverlap(a,b){if(a.id===b.id||a.date!==b.date||(a.cim||"")!==(b.cim||""))return false;const s1=toMin(a.start),e1=s1+(a.dur||0)+(a.buf||0),s2=toMin(b.start),e2=s2+(b.dur||0)+(b.buf||0);return s1<e2&&s2<e1;}
function conflictIds(events){const ids=new Set();for(let i=0;i<events.length;i++)for(let j=i+1;j<events.length;j++)if(evOverlap(events[i],events[j])){ids.add(events[i].id);ids.add(events[j].id);}return ids;}
const FR_D=["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const FR_M=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const CAL_TODAY=new Date(2026,5,24);
const SEED_EV=[
  {id:1,date:"2026-06-22",start:"09:00",dur:60,type:"inhumation",cim:"Belgrade",eq:"Équipe Nord",ref:"ALM/T4",who:"PF Lebrun — Delvaux",buf:30},
  {id:2,date:"2026-06-23",start:"10:30",dur:60,type:"inhumation",cim:"Belgrade",eq:"Équipe Nord",ref:"ALM/T1",who:"PF Dethier — Servais",buf:30},
  {id:3,date:"2026-06-23",start:"14:00",dur:90,type:"travaux",cim:"Belgrade",eq:"Équipe Sud",ref:"CHE/T7",who:"Marbrerie Dubois",buf:0},
  {id:4,date:"2026-06-24",start:"11:00",dur:60,type:"exhumation",cim:"Bouge",eq:"Équipe centrale",ref:"DIO/C/01",who:"Exhum. technique",buf:30},
  {id:5,date:"2026-06-25",start:"09:30",dur:60,type:"cremation",cim:"Belgrade",eq:"Équipe Nord",ref:"—",who:"Crématorium Champles",buf:0},
  {id:6,date:"2026-06-26",start:"13:30",dur:60,type:"inhumation",cim:"Belgrade",eq:"Équipe Sud",ref:"ALM/B/03",who:"PF Gérard — Henry",buf:30},
  {id:7,date:"2026-06-26",start:"15:30",dur:45,type:"dispersion",cim:"Belgrade",eq:"Équipe Nord",ref:"Pelouse",who:"Famille Counet",buf:0},
  {id:8,date:"2026-06-27",start:"10:00",dur:120,type:"travaux",cim:"Bomel",eq:"Équipe Sud",ref:"GIS/A/22",who:"Ets Pirard — pose monument",buf:0},
];
const HSTART=7,HEND=19,PX=46,GRIDH=(HEND-HSTART)*PX;
const HOURS=Array.from({length:HEND-HSTART+1},(_,i)=>HSTART+i);

function EventBlock({e,onClick,conflict}){
  const top=(toMin(e.start)-HSTART*60)/60*PX;const h=Math.max(e.dur/60*PX,18);
  const bufH=(e.buf||0)/60*PX;const col=CTYPES[e.type].c;
  return(<>
    {bufH>0&&<div className="pointer-events-none absolute inset-x-1 rounded-t bg-slate-400/20" style={{top:top-bufH,height:bufH}} title="Délai avant"/>}
    {bufH>0&&<div className="pointer-events-none absolute inset-x-1 rounded-b bg-slate-400/20" style={{top:top+h,height:bufH}} title="Délai après"/>}
    <div onClick={ev=>{ev.stopPropagation();onClick(e);}} className={`absolute inset-x-1 cursor-pointer overflow-hidden rounded-md px-1.5 py-0.5 text-[10px] leading-tight text-white shadow-sm ${conflict?"ring-2 ring-red-500":""}`} style={{top,height:h,background:col}}>
      <div className="font-semibold">{e.start} · {CTYPES[e.type].l}{conflict&&<span className="ml-1 rounded bg-red-600 px-1 text-[8px]">⚠ conflit</span>}</div>
      <div className="truncate opacity-90">{e.ref} · {e.who}</div>
    </div>
  </>);
}
function EvAddModal({onAdd,onClose,init}){
  const [f,setF]=useState({date:init?.date||ymd(CAL_TODAY),start:init?.start||"09:00",dur:"60",type:"inhumation",cim:CAL_CIMS[0],eq:CAL_TEAMS[0],ref:"",who:"",buf:"30"});
  const up=(k,v)=>setF(s=>({...s,[k]:v}));
  return(<div className="fixed inset-0 z-[9998] grid place-items-center bg-black/30 p-4" onClick={onClose}>
    <div className="w-full max-w-lg rounded-xl bg-white shadow-xl" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><span className="flex items-center gap-2 text-[13.5px] font-semibold text-slate-800"><Plus size={16} className="text-[#CD0947]"/>Ajouter un événement</span><button onClick={onClose}><X size={18} className="text-slate-400"/></button></div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4">
        <Field label="Date"><Inp type="date" value={f.date} onChange={e=>up("date",e.target.value)}/></Field>
        <Field label="Type"><Sel value={f.type} onChange={e=>up("type",e.target.value)}>{Object.entries(CTYPES).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}</Sel></Field>
        <Field label="Heure de début"><Inp type="time" value={f.start} onChange={e=>up("start",e.target.value)}/></Field>
        <Field label="Durée (min)"><Sel value={f.dur} onChange={e=>up("dur",e.target.value)}>{["30","45","60","90","120","180"].map(d=><option key={d}>{d}</option>)}</Sel></Field>
        <Field label="Cimetière"><Sel value={f.cim} onChange={e=>up("cim",e.target.value)}>{CAL_CIMS.map(c=><option key={c}>{c}</option>)}</Sel></Field>
        <Field label="Équipe"><Sel value={f.eq} onChange={e=>up("eq",e.target.value)}>{CAL_TEAMS.map(t=><option key={t}>{t}</option>)}</Sel></Field>
        <Field label="Référence (concession/lieu)"><Inp value={f.ref} onChange={e=>up("ref",e.target.value)} placeholder="ex. ALM/T9"/></Field>
        <Field label="Délai avant/après (min)"><Sel value={f.buf} onChange={e=>up("buf",e.target.value)}>{["0","15","30","45"].map(d=><option key={d}>{d}</option>)}</Sel></Field>
        <Field label="Intervenant / détail" full><Inp value={f.who} onChange={e=>up("who",e.target.value)} placeholder="PF Lebrun — F. Servais"/></Field>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">
        <button onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-[12.5px] text-slate-700 hover:bg-slate-100">Annuler</button>
        <button onClick={()=>onAdd({...f,id:Date.now(),dur:+f.dur,buf:+f.buf})} className="rounded-md bg-[#CD0947] px-4 py-2 text-[12.5px] font-medium text-white hover:opacity-90">Ajouter au planning</button>
      </div>
    </div></div>);
}
function EvBlockModal({onBlock,onClose}){
  const [date,setDate]=useState(ymd(CAL_TODAY));const [motif,setMotif]=useState("Jour férié");
  return(<div className="fixed inset-0 z-[9998] grid place-items-center bg-black/30 p-4" onClick={onClose}>
    <div className="w-full max-w-sm rounded-xl bg-white shadow-xl" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><span className="flex items-center gap-2 text-[13.5px] font-semibold text-slate-800"><Ban size={16} className="text-[#CD0947]"/>Bloquer une date</span><button onClick={onClose}><X size={18} className="text-slate-400"/></button></div>
      <div className="grid gap-3 p-4">
        <Field label="Date"><Inp type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field>
        <Field label="Motif"><Sel value={motif} onChange={e=>setMotif(e.target.value)}><option>Jour férié</option><option>Fermeture cimetière</option><option>Intempéries</option><option>Cérémonie communale</option></Sel></Field>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">
        <button onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-[12.5px] text-slate-700 hover:bg-slate-100">Annuler</button>
        <button onClick={()=>onBlock(date,motif)} className="rounded-md bg-[#CD0947] px-4 py-2 text-[12.5px] font-medium text-white hover:opacity-90">Bloquer</button>
      </div>
    </div></div>);
}
function HoursGutter(){
  return(<div className="w-12 shrink-0">
    <div className="h-9"/>
    <div className="relative" style={{height:GRIDH}}>{HOURS.map(h=><div key={h} className="absolute right-1 -translate-y-1/2 text-[10px] text-slate-400" style={{top:(h-HSTART)*PX}}>{pad2(h)}:00</div>)}</div>
  </div>);
}
function DayColumnBody({dayKey,events,blocked,onAddAt,onPick,conf}){
  return(<div className="relative cursor-pointer" style={{height:GRIDH}} onClick={()=>!blocked&&onAddAt(dayKey)}>
    {HOURS.map(h=><div key={h} className="absolute inset-x-0 border-t border-slate-100" style={{top:(h-HSTART)*PX}}/>)}
    {blocked?<div className="absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(45deg,#fef2f2,#fef2f2_7px,#fff_7px,#fff_14px)] text-[11px] font-medium text-red-400">Fermé — {blocked}</div>
      :events.map(e=><EventBlock key={e.id} e={e} onClick={onPick} conflict={conf&&conf.has(e.id)}/>)}
  </div>);
}
function Calendrier({events:evProp,setEvents:setEvProp}){
  const [view,setView]=useState("semaine");
  const [cursor,setCursor]=useState(new Date(2026,5,24));
  const [evLocal,setEvLocal]=useState(SEED_EV);
  const events=evProp||evLocal, setEvents=setEvProp||setEvLocal;
  const [blocked,setBlocked]=useState({});
  const [cimF,setCimF]=useState("Tous");
  const [typeF,setTypeF]=useState(Object.fromEntries(Object.keys(CTYPES).map(k=>[k,true])));
  const [add,setAdd]=useState(null);const [block,setBlock]=useState(false);
  const flt=e=>(cimF==="Tous"||e.cim===cimF)&&typeF[e.type];
  const evOfDay=k=>events.filter(e=>e.date===k&&flt(e)).sort((a,b)=>toMin(a.start)-toMin(b.start));
  const conf=conflictIds(events);
  const pick=e=>toast(`${CTYPES[e.type].l} · ${e.start} (${e.dur}′) · ${e.cim} · ${e.ref} — ${e.who}`);
  const move=n=>setCursor(c=>view==="mois"?new Date(c.getFullYear(),c.getMonth()+n,1):addDays(c,view==="jour"?n:7*n));
  const wkStart=startOfWeek(cursor);const wkDays=Array.from({length:7},(_,i)=>addDays(wkStart,i));
  let label;
  if(view==="mois")label=`${FR_M[cursor.getMonth()]} ${cursor.getFullYear()}`;
  else if(view==="jour")label=`${FR_D[(cursor.getDay()+6)%7]} ${cursor.getDate()} ${FR_M[cursor.getMonth()]} ${cursor.getFullYear()}`;
  else label=`${wkDays[0].getDate()} ${FR_M[wkDays[0].getMonth()].slice(0,4)}. – ${wkDays[6].getDate()} ${FR_M[wkDays[6].getMonth()].slice(0,4)}. ${wkDays[6].getFullYear()}`;
  const mFirst=new Date(cursor.getFullYear(),cursor.getMonth(),1);
  const mStart=startOfWeek(mFirst);const mCells=Array.from({length:42},(_,i)=>addDays(mStart,i));
  return(<div className="flex h-full flex-col bg-slate-50">
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
      <h2 className="mr-2 text-[14px] font-semibold text-slate-800">Agenda des fossoyeurs</h2>
      <div className="flex overflow-hidden rounded-md border border-slate-300 text-[12px]">{[["mois","Mois"],["semaine","Semaine"],["jour","Jour"]].map(([k,l])=><button key={k} onClick={()=>setView(k)} className={`px-3 py-1.5 ${view===k?"bg-[#CD0947] text-white":"bg-white text-slate-600 hover:bg-slate-50"}`}>{l}</button>)}</div>
      <div className="flex items-center gap-1">
        <button onClick={()=>move(-1)} className="grid h-7 w-7 place-items-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50">‹</button>
        <button onClick={()=>setCursor(new Date(2026,5,24))} className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] text-slate-700 hover:bg-slate-50">Aujourd'hui</button>
        <button onClick={()=>move(1)} className="grid h-7 w-7 place-items-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50">›</button>
      </div>
      <span className="text-[13px] font-medium capitalize text-slate-700">{label}</span>
      <div className="ml-auto flex items-center gap-2">
        <Sel value={cimF} onChange={e=>setCimF(e.target.value)}><option>Tous</option>{CAL_CIMS.map(c=><option key={c}>{c}</option>)}</Sel>
        <button onClick={()=>setBlock(true)} className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[12px] text-slate-700 hover:bg-slate-100"><Ban size={14}/>Bloquer</button>
        <button onClick={()=>setAdd({date:ymd(cursor)})} className="flex items-center gap-1.5 rounded-md bg-[#CD0947] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90"><Plus size={14}/>Ajouter</button>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-100 bg-white px-4 py-1.5 text-[11px]">
      <span className="text-slate-400">Filtrer :</span>
      {Object.entries(CTYPES).map(([k,v])=><button key={k} onClick={()=>setTypeF(t=>({...t,[k]:!t[k]}))} className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${typeF[k]?"text-slate-700":"text-slate-300 line-through"}`}><span className="h-2.5 w-2.5 rounded-sm" style={{background:typeF[k]?v.c:"#cbd5e1"}}/>{v.l}</button>)}
    </div>
    {conf.size>0&&<div className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-4 py-1.5 text-[11.5px] text-red-700"><span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-medium text-white">⚠ {conf.size}</span>Créneaux en conflit détectés (même cimetière, horaires qui se chevauchent) — vérifiez le planning.</div>}

    <div className="min-h-0 flex-1 overflow-auto p-4">
      {view==="semaine"&&<div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex">
          <HoursGutter/>
          <div className="grid flex-1" style={{gridTemplateColumns:"repeat(7,minmax(0,1fr))"}}>
            {wkDays.map((d,i)=>{const k=ymd(d);return(<div key={k} className="border-l border-slate-100">
              <div className={`flex h-9 flex-col items-center justify-center ${blocked[k]?"bg-red-50":sameDay(d,CAL_TODAY)?"bg-[#CD0947]/5":""}`}>
                <span className={`text-[12px] font-semibold ${sameDay(d,CAL_TODAY)?"text-[#CD0947]":"text-slate-600"}`}>{FR_D[i]} {d.getDate()}</span></div>
              <DayColumnBody dayKey={k} events={evOfDay(k)} blocked={blocked[k]} onAddAt={dk=>setAdd({date:dk})} onPick={pick} conf={conf}/>
            </div>);})}
          </div>
        </div>
      </div>}

      {view==="jour"&&<div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex">
          <HoursGutter/>
          <div className="flex-1 border-l border-slate-100"><div className="h-9"/><DayColumnBody dayKey={ymd(cursor)} events={evOfDay(ymd(cursor))} blocked={blocked[ymd(cursor)]} onAddAt={dk=>setAdd({date:dk})} onPick={pick} conf={conf}/></div>
        </div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 text-[12px] font-semibold text-slate-700">Événements du jour</div>
          {evOfDay(ymd(cursor)).length?evOfDay(ymd(cursor)).map(e=>(<div key={e.id} onClick={()=>pick(e)} className="mb-1.5 flex cursor-pointer items-center gap-2 rounded-md border border-slate-100 p-2 hover:bg-slate-50">
            <span className="h-8 w-1 rounded" style={{background:CTYPES[e.type].c}}/>
            <div className="min-w-0"><div className="text-[12px] font-medium text-slate-800">{e.start} · {CTYPES[e.type].l}</div><div className="truncate text-[11px] text-slate-500">{e.cim} · {e.ref} — {e.who}</div></div></div>)):
            <p className="text-[12px] text-slate-400">Aucun événement — cliquez « Ajouter ».</p>}
          <div className="mt-2 rounded-md bg-slate-50 p-2 text-[11px] text-slate-500">Les zones grisées autour d'une inhumation représentent les <b>délais avant/après</b> (préparation et fermeture de la fosse).</div>
        </div>
      </div>}

      {view==="mois"&&<div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[11px] font-semibold text-slate-400">{FR_D.map(d=><div key={d} className="py-2">{d}</div>)}</div>
        <div className="grid grid-cols-7">{mCells.map((d,i)=>{const k=ymd(d);const inM=d.getMonth()===cursor.getMonth();const evs=evOfDay(k);return(
          <div key={k} onClick={()=>{setCursor(new Date(d));setView("jour");}} className={`min-h-[92px] cursor-pointer border-b border-l border-slate-100 p-1.5 hover:bg-slate-50 ${inM?"":"bg-slate-50/60"}`}>
            <div className={`mb-1 text-right text-[11px] ${sameDay(d,CAL_TODAY)?"font-bold text-[#CD0947]":inM?"text-slate-500":"text-slate-300"}`}>{blocked[k]&&<span className="float-left text-red-400" title={blocked[k]}>●</span>}{d.getDate()}</div>
            {evs.slice(0,3).map(e=><div key={e.id} onClick={ev=>{ev.stopPropagation();pick(e);}} className="mb-0.5 truncate rounded px-1 py-0.5 text-[10px] text-white" style={{background:CTYPES[e.type].c}}>{e.start} {e.ref}</div>)}
            {evs.length>3&&<div className="text-[10px] text-slate-400">+{evs.length-3} autre(s)</div>}
          </div>);})}</div>
      </div>}
      <p className="mt-3 text-[11px] text-slate-400">Cliquez une zone libre (semaine/jour) ou une case (mois) pour planifier. Les permis d'inhumer (PF) et autorisations de travaux (marbriers) alimentent ce planning.</p>
    </div>
    {add&&<EvAddModal init={add} onClose={()=>setAdd(null)} onAdd={ev=>{setEvents(s=>[...s,ev]);setAdd(null);toast("Événement ajouté au "+ev.date);}}/>}
    {block&&<EvBlockModal onClose={()=>setBlock(false)} onBlock={(d,m)=>{setBlocked(b=>({...b,[d]:m}));setBlock(false);toast("Date bloquée : "+d);}}/>}
  </div>);
}

/* ---------- EXHUMATIONS ---------- */
function Exhumations({onDelib}){
  return(<div className="h-full overflow-auto bg-slate-50 p-6">
    <h2 className="text-[15px] font-semibold text-slate-800">Exhumations</h2>
    <p className="text-[12px] text-slate-500">Régimes 2026 : confort · technique · judiciaire — avec contrôle du délai sanitaire (CDLD L1232-5).</p>
    <div className="mt-4 rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-[12px]"><thead><tr className="border-b border-slate-200 text-left text-[10.5px] uppercase tracking-wide text-slate-400">
        {["Réf.","Type","Demandeur","Date souhaitée","Délai sanitaire","Autorisation","Statut",""].map(h=><th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
        <tbody>{EXHUM.map((e,i)=>(<tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
          <td className="px-3 py-2 font-mono font-medium text-slate-800">{e.ref}</td>
          <td className="px-3 py-2"><span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{background:e.c+"1A",color:e.c}}>{e.type}</span></td>
          <td className="px-3 py-2 text-slate-700">{e.demandeur}</td><td className="px-3 py-2 font-mono text-slate-500">{e.date}</td>
          <td className="px-3 py-2 text-slate-600">{e.sanitaire}</td><td className="px-3 py-2 text-slate-600">{e.autorisation}</td>
          <td className="px-3 py-2 text-slate-700">{e.statut}</td>
          <td className="px-3 py-2 text-right"><button onClick={()=>onDelib&&onDelib({extId:"CIM/EXH/"+(e.ref||"").replace(/\//g,"-"),objet:"Autorisation d'exhumation ("+e.type.toLowerCase()+") — concession "+e.ref,type:"meeting-config-college",cat:"Cimetières — exhumations",proposition:"Le Collège communal autorise l'exhumation ("+e.type.toLowerCase()+") de la concession "+e.ref+", demandée par "+e.demandeur+", sous réserve du respect du délai sanitaire et des prescriptions de police des funérailles (CDLD L1232-5)."})} title="Inscrire au Collège (iA.Délib)" className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:border-[#15324a]/40 hover:text-[#15324a]"><Gavel size={13}/>Délibé</button></td></tr>))}</tbody></table>
    </div>
    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-[11.5px] text-amber-900"><AlertTriangle size={13} className="mr-1 inline"/>Garde-fou : toute exhumation dans la période 15/11 → 15/04 ou dans le délai sanitaire de 8 semaines à 5 ans est bloquée sauf dérogation « confort » ou « technique » dûment autorisée.</div>
  </div>);
}

/* ---------- helpers formulaires ---------- */
const INP="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[#CD0947]/60";
const Field=({label,children,full})=>(<label className={`block ${full?"sm:col-span-2 lg:col-span-3":""}`}><span className="mb-1 block text-[11px] font-medium text-slate-500">{label}</span>{children}</label>);
const Inp=(p)=><input className={INP} {...p}/>;
const Sel=({children,...p})=><select className={INP} {...p}>{children}</select>;
const Txt=(p)=><textarea className={INP+" min-h-[72px]"} {...p}/>;
const Sub=({children})=><h3 className="mb-2 mt-4 border-b border-slate-100 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 first:mt-0">{children}</h3>;
function FormPage({title,subtitle,icon,children,submitLabel="Enregistrer"}){
  const [done,setDone]=useState(false);
  return(<div className="h-full overflow-y-auto bg-slate-50 p-6"><div className="mx-auto max-w-4xl">
    <div className="mb-3 flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#CD0947]/10 text-[#CD0947]">{icon}</span>
      <div><h2 className="text-[15px] font-semibold text-slate-800">{title}</h2><p className="text-[12px] text-slate-500">{subtitle}</p></div></div>
    {done&&<div className="mb-3 rounded-md border border-green-200 bg-green-50 p-2.5 text-[12px] text-green-800"><CheckCircle2 size={14} className="mr-1 inline"/>Enregistré (maquette — aucune donnée réellement sauvegardée).</div>}
    <div className="rounded-xl border border-slate-200 bg-white p-5">{children}</div>
    <div className="mt-3 flex gap-2"><button onClick={()=>{setDone(true);toast("Enregistré");}} className="rounded-md bg-[#CD0947] px-4 py-2 text-[13px] font-medium text-white hover:opacity-90">{submitLabel}</button><button onClick={()=>{setDone(false);toast("Modifications annulées");}} className="rounded-md border border-slate-300 px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-100">Annuler</button></div>
  </div></div>);
}
const Grid3=({children})=><div className="grid gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
const Upload2=({label})=>(<div className="sm:col-span-2 lg:col-span-3"><span className="mb-1 block text-[11px] font-medium text-slate-500">{label}</span>
  <div className="flex items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-[12px] text-slate-500"><Upload size={16}/>Glisser-déposer ou cliquer pour téléverser (photos, PDF…)</div></div>);

/* ---------- DÉCLARATION DE DÉCÈS ---------- */
function DeclarationDeces(){
  return(<FormPage icon={<ClipboardList size={18}/>} title="Déclaration de décès" subtitle="Encodage d'un décès et des dernières volontés (lié au registre population / état-civil).">
    <Sub>Défunt</Sub><Grid3>
      <Field label="Nom"><Inp defaultValue="DELVAUX"/></Field><Field label="Prénom(s)"><Inp defaultValue="Henri Joseph"/></Field>
      <Field label="N° national"><Inp defaultValue="18.07.11-153.42"/></Field>
      <Field label="Sexe"><Sel><option>Masculin</option><option>Féminin</option><option>X</option></Sel></Field>
      <Field label="Date de naissance"><Inp type="date" defaultValue="1889-03-04"/></Field><Field label="Lieu de naissance"><Inp defaultValue="Corroy-le-Grand"/></Field>
    </Grid3>
    <Sub>Décès</Sub><Grid3>
      <Field label="Date du décès"><Inp type="date" defaultValue="2026-06-20"/></Field><Field label="Heure"><Inp type="time" defaultValue="06:30"/></Field>
      <Field label="Lieu du décès"><Sel><option>Domicile</option><option>Hôpital</option><option>Maison de repos</option><option>Voie publique</option></Sel></Field>
      <Field label="Adresse du domicile" full><Inp defaultValue="12 rue du Tilleul, 1325 Namur"/></Field>
    </Grid3>
    <Sub>Funérailles & volontés</Sub><Grid3>
      <Field label="Mode de sépulture"><Sel><option>Inhumation</option><option>Crémation</option></Sel></Field>
      <Field label="Cimetière"><Sel>{CEMETERIES.map(c=><option key={c.id}>{c.nom}</option>)}</Sel></Field>
      <Field label="Concession (réf.)"><Inp placeholder="ex. ALM/T4"/></Field>
      <Field label="Pompes funèbres"><Inp defaultValue="PF Lebrun"/></Field>
      <Field label="Rite funéraire"><Sel><option>Civil</option><option>Catholique</option><option>Protestant</option><option>Islamique</option><option>Israélite</option><option>Laïque</option></Sel></Field>
      <Field label="Contrat obsèques (2026)"><Sel><option>Aucun</option><option>Oui — à vérifier</option></Sel></Field>
      <Field label="Destination des cendres"><Sel><option>—</option><option>Inhumation d'urne</option><option>Dispersion</option><option>Conservation à domicile</option></Sel></Field>
      <Field label="Animal de compagnie (2026)"><Sel><option>Non</option><option>Cendres placées avec le défunt</option></Sel></Field>
    </Grid3>
    <Sub>Déclarant</Sub><Grid3>
      <Field label="Nom du déclarant"><Inp defaultValue="DELVAUX Sophie"/></Field><Field label="Lien"><Inp defaultValue="Petite-fille"/></Field><Field label="Téléphone"><Inp defaultValue="0470 12 34 56"/></Field>
    </Grid3>
  </FormPage>);
}

/* ---------- DEMANDE MARBRIER ---------- */
function MarbrierForm(){
  return(<FormPage icon={<Hammer size={18}/>} title="Demande d'autorisation de travaux (marbrier)" subtitle="Accès au cimetière et travaux sur une concession — alimente le calendrier des fossoyeurs.">
    <Sub>Entreprise</Sub><Grid3>
      <Field label="Marbrerie / entreprise"><Inp defaultValue="Marbrerie Dubois"/></Field><Field label="Personne de contact"><Inp defaultValue="J. Dubois"/></Field><Field label="Téléphone"><Inp defaultValue="010 65 .. .."/></Field>
    </Grid3>
    <Sub>Travaux</Sub><Grid3>
      <Field label="Concession concernée (réf.)"><Inp defaultValue="BRT/T3"/></Field>
      <Field label="Type de travaux"><Sel><option>Pose de monument</option><option>Gravure / lettrage</option><option>Nettoyage</option><option>Dépose</option><option>Fondation / semelle</option><option>Réparation</option></Sel></Field>
      <Field label="Accès véhicule"><Sel><option>Non</option><option>Oui — allée principale</option></Sel></Field>
      <Field label="Date de début souhaitée"><Inp type="date" defaultValue="2026-06-27"/></Field>
      <Field label="Date de fin"><Inp type="date" defaultValue="2026-06-27"/></Field>
      <Field label="Description des travaux" full><Txt defaultValue="Pose d'un monument en petit granit, semelle béton existante."/></Field>
    </Grid3>
    <Upload2 label="Pièces jointes (plan du monument, bon de commande…)"/>
  </FormPage>);
}

/* ---------- FORMULAIRE SIHL ---------- */
function FicheSIHLForm(){
  return(<FormPage icon={<Landmark size={18}/>} title="Encoder une sépulture d'importance historique" subtitle="Formulaire d'inventaire SIHL — Région wallonne (Décret du 06/03/2009, art. L1232-29).">
    <Sub>Identification</Sub><Grid3>
      <Field label="Concession (réf.)"><Inp defaultValue="ALM/H1"/></Field><Field label="Dénomination"><Inp defaultValue="Sépulture du Caporal Henri DELVAUX"/></Field>
      <Field label="N° d'inventaire"><Inp defaultValue="SIHL-2024-017"/></Field>
      <Field label="Catégorie"><Sel><option>Ancien combattant 14-18</option><option>Ancien combattant 40-45</option><option>Personnalité locale</option><option>Intérêt architectural</option><option>Intérêt historique</option><option>Intérêt artistique</option></Sel></Field>
      <Field label="Motif / décret"><Inp defaultValue="Décret GW 6 mars 2009 – Art. L1232-29"/></Field>
      <Field label="Date de classement"><Inp type="date" defaultValue="2024-05-14"/></Field>
    </Grid3>
    <Sub>Critères d'importance historique locale (art. L1232-29)</Sub><Grid3>
      <Field label="Intérêt historique"><Sel><option>Oui</option><option>Non</option></Sel></Field>
      <Field label="Intérêt artistique"><Sel><option>Oui</option><option>Non</option></Sel></Field>
      <Field label="Intérêt paysager"><Sel><option>Non</option><option>Oui</option></Sel></Field>
      <Field label="Intérêt technique"><Sel><option>Non</option><option>Oui</option></Sel></Field>
    </Grid3>
    <Sub>Description</Sub><Grid3>
      <Field label="Auteur / sculpteur"><Inp defaultValue="—"/></Field>
      <Field label="Matériaux"><Inp defaultValue="Petit granit"/></Field>
      <Field label="État de conservation"><Sel><option>Bon</option><option>Moyen</option><option>À restaurer</option></Sel></Field>
      <Field label="Description architecturale" full><Txt defaultValue="Stèle en petit granit, croix latine, épitaphe gravée et insigne militaire."/></Field>
      <Field label="Épitaphe" full><Inp defaultValue="« Mort pour la Patrie — 1918 »"/></Field>
    </Grid3>
    <Upload2 label="Photographies du monument"/>
    <Sub>Publication</Sub><Grid3>
      <Field label="Publier sur le portail public"><Sel><option>Oui</option><option>Non</option></Sel></Field>
      <Field label="Notice publique (message)" full><Txt defaultValue="Henri Delvaux, caporal au 2e régiment de ligne, tombé en novembre 1918…"/></Field>
    </Grid3>
  </FormPage>);
}

/* ---------- PAGE PUBLIQUE SIHL (site internet) ---------- */
function SIHLPublicSite(){
  const [msgs,setMsgs]=useState([
    {n:"Marie L.",t:"Mon arrière-grand-père. Merci de préserver sa mémoire.",d:"il y a 3 jours"},
    {n:"Cercle d'histoire de Namur",t:"Stèle restaurée en 2019 — un témoignage précieux de 14-18.",d:"il y a 1 semaine"},
  ]);
  const [v,setV]=useState("");
  const add=()=>{if(v.trim()){setMsgs([{n:"Visiteur",t:v.trim(),d:"à l'instant"},...msgs]);setV("");}};
  return(<div className="h-full overflow-y-auto bg-slate-100">
    <div className="bg-[#15222b] px-6 py-3 text-white"><div className="mx-auto flex max-w-4xl items-center justify-between"><div className="text-[13.5px] font-semibold">Cimetières de Namur · Patrimoine funéraire</div><span className="text-[11px] text-slate-300">Page mémoire publique</span></div></div>
    <div className="mx-auto max-w-4xl p-6">
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="relative h-48 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-500">
          <div className="absolute inset-0 grid place-items-center text-white/25"><ImageIcon size={52}/></div>
          <span className="absolute left-4 top-4 rounded-full bg-[#E6790A] px-2.5 py-1 text-[11px] font-medium text-white">Ancien combattant 14-18</span>
        </div>
        <div className="p-6">
          <h1 className="text-[24px] font-bold text-slate-900" style={{fontFamily:"Georgia,serif"}}>Caporal Henri DELVAUX</h1>
          <p className="text-[13px] text-slate-500">1889 – 1918 · Sépulture <span className="font-mono">ALM/H1</span> · Cimetière de Belgrade</p>
          <p className="mt-3 text-[13.5px] leading-relaxed text-slate-700">Henri Delvaux, caporal au 2ᵉ régiment de ligne, est tombé au champ d'honneur en novembre 1918, quelques jours avant l'Armistice. Sa sépulture, classée d'importance historique locale, est entretenue par la commune et restaurée en 2019. Elle témoigne de l'engagement des habitants de Namur durant la Grande Guerre.</p>

          <h3 className="mt-6 text-[13px] font-semibold text-slate-800">Photos & documents</h3>
          <div className="mt-2 grid grid-cols-4 gap-2">{[0,1,2,3].map(i=><div key={i} className="grid aspect-square place-items-center rounded-lg bg-slate-100 text-slate-300"><ImageIcon size={22}/></div>)}</div>

          <h3 className="mt-6 text-[13px] font-semibold text-slate-800">Vidéo</h3>
          <div className="mt-2 grid aspect-video w-full place-items-center rounded-xl bg-slate-900 text-white/70"><div className="flex flex-col items-center gap-1"><Play size={34}/><span className="text-[11px]">Hommage — cérémonie du 11 novembre</span></div></div>

          <h3 className="mt-6 text-[13px] font-semibold text-slate-800">Hommages & messages</h3>
          <div className="mt-2 flex gap-2">
            <input value={v} onChange={e=>setV(e.target.value)} placeholder="Laisser un message…" className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-[12.5px] outline-none focus:border-[#CD0947]/50"/>
            <button onClick={add} className="flex items-center gap-1 rounded-full bg-[#CD0947] px-4 py-2 text-[12.5px] font-medium text-white hover:opacity-90"><Send size={14}/>Publier</button>
          </div>
          <div className="mt-3 space-y-2">{msgs.map((m,i)=>(<div key={i} className="rounded-lg bg-slate-50 p-3"><div className="flex items-center justify-between"><span className="text-[12.5px] font-medium text-slate-800">{m.n}</span><span className="text-[11px] text-slate-400">{m.d}</span></div><p className="text-[12.5px] text-slate-600">{m.t}</p></div>))}</div>

          <div className="mt-6 flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
            <div className="grid h-14 w-14 place-items-center rounded bg-white"><QrCode size={36} className="text-slate-800"/></div>
            <div className="flex-1 text-[12px] text-orange-900"><div className="font-semibold">QR apposé sur la sépulture</div><div className="opacity-80">Scanner mène directement à cette page mémoire.</div></div>
            <button onClick={()=>{try{navigator.clipboard&&navigator.clipboard.writeText(window.location.href);}catch(e){}toast("Lien de la page mémoire copié");}} className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[12px] text-slate-700"><Share2 size={13}/>Partager</button>
          </div>
        </div>
      </article>
    </div>
  </div>);
}

/* ---------- PATRIMOINE (tabbed : inventaire + encoder + page publique) ---------- */
function PatrimoineInventaire({onOpen,goEncode}){
  const list=PLOTS.filter(p=>p.nature==="sihl").map(p=>RECORDS[p.ref]);
  return(<div className="p-6">
    <div className="flex items-center justify-between"><div><h2 className="text-[15px] font-semibold text-slate-800">Inventaire SIHL</h2><p className="text-[12px] text-slate-500">Sépultures d'importance historique locale (Décret GW 06/03/2009).</p></div>
      <button onClick={goEncode} className="flex items-center gap-1.5 rounded-md bg-[#CD0947] px-3 py-2 text-[12.5px] font-medium text-white hover:opacity-90"><PlusSquare size={15}/>Encoder une SIHL</button></div>
    <div className="mt-4 grid gap-3 md:grid-cols-2">{list.map(r=>(
      <div key={r.ref} className="rounded-xl border border-orange-200 bg-white p-4">
        <div className="flex items-start justify-between"><div><div className="font-mono text-[13px] font-semibold text-slate-900">{r.ref}</div><div className="text-[12.5px] text-slate-700">{r.denom1}</div></div>
          <div className="grid h-12 w-12 place-items-center rounded bg-orange-50"><QrCode size={30} className="text-slate-800"/></div></div>
        <p className="mt-2 text-[11.5px] text-slate-600">{r.sihl?.architecture}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{background:"#E6790A1A",color:"#E6790A"}}>{r.sihl?.categorie}</span>
          <button onClick={()=>onOpen(r.ref)} className="text-[11.5px] text-slate-500 hover:text-slate-800">Ouvrir le dossier →</button></div>
      </div>))}</div>
  </div>);
}
function Patrimoine({onOpen}){
  const [tab,setTab]=useState("inv");
  const tabs=[["inv","Inventaire"],["enc","Encoder une SIHL"],["comb","Anciens combattants"],["pub","Page publique"]];
  return(<div className="flex h-full flex-col bg-slate-50">
    <div className="flex gap-1 border-b border-slate-200 bg-white px-4 pt-2 text-[12.5px]">
      {tabs.map(([k,l])=><button key={k} onClick={()=>setTab(k)} className={`rounded-t-md px-3 py-2 ${tab===k?"border-b-2 border-[#CD0947] font-semibold text-slate-900":"text-slate-500 hover:text-slate-700"}`}>{l}</button>)}
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto">
      {tab==="inv"&&<PatrimoineInventaire onOpen={onOpen} goEncode={()=>setTab("enc")}/>}
      {tab==="enc"&&<FicheSIHLForm/>}
      {tab==="comb"&&<AnciensCombattantsForm/>}
      {tab==="pub"&&<SIHLPublicSite/>}
    </div>
  </div>);
}

/* ---------- CRÉATION D'EMPLACEMENT (encodage carto) ---------- */
function CreateEmplacement({onClose}){
  const [done,setDone]=useState(false);
  return(<div className="absolute inset-0 z-20 grid place-items-center bg-black/30 p-4" onClick={onClose}>
    <div className="w-full max-w-lg rounded-xl bg-white shadow-xl" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div className="flex items-center gap-2 text-[13.5px] font-semibold text-slate-800"><PlusSquare size={16} className="text-[#CD0947]"/>Créer un emplacement</div><button onClick={onClose}><X size={18} className="text-slate-400"/></button></div>
      {done?<div className="p-6 text-center"><CheckCircle2 size={34} className="mx-auto text-green-600"/><p className="mt-2 text-[13px] text-slate-700">Emplacement créé sur le plan (maquette).</p><button onClick={onClose} className="mt-3 rounded-md bg-slate-800 px-4 py-2 text-[12.5px] text-white">Fermer</button></div>:
      <div className="p-4">
        <div className="mb-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-[12px] text-slate-500">Tracez le polygone sur le plan (largeur, longueur ou forme libre), puis encodez la fiche ci-dessous.</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Field label="Cimetière"><Sel>{CEMETERIES.map(c=><option key={c.id}>{c.nom}</option>)}</Sel></Field>
          <Field label="Référence (allée/n°)"><Inp placeholder="ex. ALM/T31"/></Field>
          <Field label="Nature"><Sel>{Object.values(NATURES).map(n=><option key={n.label}>{n.label}</option>)}</Sel></Field>
          <Field label="Durée"><Sel><option>15 ans</option><option>30 ans</option><option>50 ans</option><option>Perpétuelle</option><option>Gratuite 30 ans (étoiles)</option></Sel></Field>
          <Field label="Longueur (m)"><Inp defaultValue="2.10"/></Field><Field label="Largeur (m)"><Inp defaultValue="1.10"/></Field>
          <Field label="Nombre de places"><Inp defaultValue="2"/></Field><Field label="Statut"><Sel><option>Libre</option><option>Octroyée</option></Sel></Field>
        </div>
        <div className="mt-4 flex gap-2"><button onClick={()=>{setDone(true);toast("Emplacement créé");}} className="rounded-md bg-[#CD0947] px-4 py-2 text-[12.5px] font-medium text-white hover:opacity-90">Créer l'emplacement</button><button onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-[12.5px] text-slate-700">Annuler</button></div>
      </div>}
    </div>
  </div>);
}

/* ---------- PORTAIL PUBLIC CITOYEN ---------- */
function PortailPublic({onQR}){
  const [q,setQ]=useState("Servais");
  const res=PLOTS.map(p=>RECORDS[p.ref]).filter(r=>r.inhumes?.some(x=>x.nom.toLowerCase().includes(q.toLowerCase()))).slice(0,4);
  return(<div className="h-full overflow-auto bg-gradient-to-b from-slate-100 to-slate-50 p-6">
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
        <Globe size={22} className="mx-auto text-slate-400"/>
        <h2 className="mt-1 text-[16px] font-semibold text-slate-800">Cimetières de Namur</h2>
        <p className="text-[12px] text-slate-500">Retrouvez la sépulture d'un proche</p>
        <div className="relative mx-auto mt-3 max-w-md"><Search size={15} className="pointer-events-none absolute left-3 top-2.5 text-slate-400"/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Nom du défunt…" className="w-full rounded-full border border-slate-300 py-2 pl-9 pr-3 text-[13px] outline-none focus:border-slate-400"/></div>
      </div>
      <div className="mt-4 space-y-2">{res.length?res.map(r=>{const x=r.inhumes.find(i=>i.nom.toLowerCase().includes(q.toLowerCase()));return(
        <div key={r.ref} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="grid h-11 w-11 place-items-center rounded bg-slate-100"><QrCode size={24} className="text-slate-700"/></div>
          <div className="flex-1"><div className="text-[13.5px] font-medium text-slate-800">{x?.nom}</div>
            <div className="text-[11.5px] text-slate-500">{x?.naissance} – {x?.deces} · {r.cimetiere} · emplacement <span className="font-mono">{r.ref}</span></div></div>
          <button className="flex items-center gap-1 rounded-md bg-slate-800 px-3 py-1.5 text-[12px] text-white hover:bg-slate-700"><MapPin size={13}/>Localiser</button>
          <button onClick={()=>onQR&&onQR({ref:r.ref,defunt:x?.nom||r.denom1})} className="flex items-center gap-1 rounded-md border border-[#CD0947]/40 px-3 py-1.5 text-[12px] font-medium text-[#CD0947] hover:bg-[#CD0947]/5"><QrCode size={13}/>Plaque QR</button>
        </div>);}):<p className="text-center text-[12px] italic text-slate-400">Aucun résultat.</p>}</div>
      <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-[#CD0947]/20 bg-[#CD0947]/5 p-4">
        <div className="flex items-center gap-2 text-[12px] text-slate-700"><Heart size={16} className="text-[#CD0947]"/><span>Créez un <b>mémorial numérique</b> et commandez une plaque QR à poser sur la tombe (partenaire Forever Connected).</span></div>
        <button onClick={()=>onQR&&onQR({ref:"",defunt:""})} className="flex shrink-0 items-center gap-1.5 rounded-md bg-[#CD0947] px-3.5 py-2 text-[12px] font-medium text-white hover:opacity-90"><ShoppingCart size={14}/>Commander</button>
      </div>
      <p className="mt-3 text-center text-[11px] text-slate-400">Données publiques limitées (nom, dates, localisation) · QR menant à la page mémoire pour les sépultures d'importance historique.</p>
    </div>
  </div>);
}

/* ---------- CARTE OPENSTREETMAP (Leaflet) ---------- */
function LeafletMap({plots,colorOf,onSelect,center,dim}){
  const elRef=useRef(null),mapRef=useRef(null),layerRef=useRef(null);
  const M=111000;
  const toLL=useCallback((px,py)=>{const fx=px/560,fy=py/520;const dlat=(0.5-fy)*(130/M);const dlon=(fx-0.5)*(150/(M*Math.cos(center[0]*Math.PI/180)));return [center[0]+dlat,center[1]+dlon];},[center]);
  const poly=p=>[toLL(p.x,p.y),toLL(p.x+p.w,p.y),toLL(p.x+p.w,p.y+p.h),toLL(p.x,p.y+p.h)];
  const draw=useCallback(()=>{
    if(!layerRef.current)return;layerRef.current.clearLayers();
    L.polygon([toLL(18,18),toLL(542,18),toLL(542,502),toLL(18,502)],{color:"#8f9a92",weight:1.5,fillColor:"#cfe3c4",fillOpacity:.3,dashArray:"5 4"}).addTo(layerRef.current);
    plots.forEach(p=>{if(dim&&dim(p))return;const fill=p.statut==="libre"?"#F4F7F3":(colorOf?colorOf(p):"#888");
      const pg=L.polygon(poly(p),{color:"#334155",weight:1,fillColor:fill,fillOpacity:.88});
      pg.on("click",()=>onSelect(p.ref));pg.bindTooltip(p.ref,{direction:"top",opacity:.9});pg.addTo(layerRef.current);});
  },[plots,colorOf,dim,toLL]);
  useEffect(()=>{
    if(mapRef.current)return;
    const map=L.map(elRef.current,{zoomControl:true}).setView(center,18);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:20,attribution:"© OpenStreetMap contributors"}).addTo(map);
    layerRef.current=L.layerGroup().addTo(map);mapRef.current=map;
    setTimeout(()=>map.invalidateSize(),150);draw();
  },[]);
  useEffect(()=>{if(mapRef.current){mapRef.current.setView(center,18);draw();}},[center,draw]);
  return <div ref={elRef} className="h-full w-full" style={{background:"#dfe7da"}}/>;
}

/* ---------- CARTE NAMUR (open data en direct) ---------- */
const ODS="https://data.namur.be/api/explore/v2.1/catalog/datasets/";
function Badge({children,tone}){const m={red:"bg-red-600",amber:"bg-amber-500"}[tone]||"bg-slate-800";return <div className={`absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-full ${m} px-3 py-1.5 text-[11.5px] font-medium text-white shadow`}>{children}</div>;}
const WAR_ANCHOR=[50.4732,4.8344]; // Cimetière de Namur dit de Belgrade — chaussée de Waterloo (carré militaire / pelouse d'honneur)
const _mLat=1/111320,_mLng=1/(111320*Math.cos(50.4732*Math.PI/180));
const WAR_SITES=[
  {n:"Croix du Sacrifice",e:8,no:34,t:"Monument commémoratif (Commonwealth)"},
  {n:"Pelouse d'honneur belge",e:22,no:22,t:"Carré militaire 14‑18 / 40‑45"},
  {n:"Pelouse d'honneur britannique & Commonwealth",e:34,no:10,t:"245 sépultures · entretien CWGC"},
  {n:"Pelouse d'honneur française",e:30,no:-8,t:"Carré militaire"},
  {n:"Pelouse d'honneur italienne",e:18,no:-20,t:"Carré militaire"},
  {n:"Carré soviétique 1941‑1945",e:2,no:-28,t:"Carré militaire"},
  {n:"Monument aux civils fusillés 1914‑1918",e:-14,no:18,t:"Monument"},
  {n:"Monument aux prisonniers politiques 1940‑1945",e:-18,no:-12,t:"Monument"},
  {n:"Monument von Zastrow (1815)",e:-22,no:30,t:"Monument · guerres napoléoniennes"},
].map(s=>({...s,lat:WAR_ANCHOR[0]+s.no*_mLat,lng:WAR_ANCHOR[1]+s.e*_mLng}));
function NamurMap({cem,field,onOpen,focus,empl,statutByRef,onEmpl}){
  const elRef=useRef(null),mapRef=useRef(null),layerRef=useRef(null),warRef=useRef(null),emplRef=useRef(null),selLayerRef=useRef(null);
  const [warOn,setWarOn]=useState(false);
  const [status,setStatus]=useState("idle"),[legend,setLegend]=useState([]);
  const [coord,setCoord]=useState("");
  const [coordSys,setCoordSys]=useState("wgs");const coordSysRef=useRef("wgs"),llRef=useRef(null);
  useEffect(()=>{coordSysRef.current=coordSys;if(llRef.current)setCoord(fmtCoord(coordSys,llRef.current[0],llRef.current[1]));},[coordSys]);
  const measRef=useRef({mode:null,pts:[],layer:null});
  const [mMode,setMMode]=useState(null);const [mRes,setMRes]=useState("");
  const fmtD=m=>m>=1000?(m/1000).toFixed(2)+" km":Math.round(m)+" m";
  const fmtA=a=>a>=10000?(a/10000).toFixed(2)+" ha":Math.round(a)+" m²";
  const startMeasure=mode=>{const m=mapRef.current,M=measRef.current;if(M.layer&&m)m.removeLayer(M.layer);M.layer=null;M.pts=[];M.mode=mode;setMMode(mode);setMRes(mode==="dist"?"Cliquez les points · double‑clic pour terminer":"Cliquez les sommets · double‑clic pour terminer");if(m)m.doubleClickZoom.disable();};
  const clearMeasure=()=>{const m=mapRef.current,M=measRef.current;if(M.layer&&m)m.removeLayer(M.layer);M.layer=null;M.pts=[];M.mode=null;setMMode(null);setMRes("");if(m)m.doubleClickZoom.enable();};
  const colorsRef=useRef({});
  const palette=["#1D48CC","#2E971F","#E6790A","#854B3D","#FD6786","#8E7CC3","#7D7C83","#A88E6A","#4F5B62","#6B7A45","#C0392B","#3a5aa0","#0E7490","#9D174D"];
  const colorFor=v=>{const c=colorsRef.current;if(!(v in c))c[v]=palette[Object.keys(c).length%palette.length];return c[v];};
  useEffect(()=>{if(mapRef.current)return;
    const map=L.map(elRef.current,{zoomControl:true,preferCanvas:true}).setView(cem?.coord||[50.3377,4.5157],17);
    const osm=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:21,attribution:"© OpenStreetMap"});
    const aer=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{maxZoom:21,attribution:"© Esri"});
    const wal=L.tileLayer.wms("https://geoservices.wallonie.be/arcgis/services/IMAGERIE/ORTHO_LAST/MapServer/WMSServer",{layers:"0",format:"image/jpeg",version:"1.3.0",maxZoom:21,attribution:"Orthophotos © SPW — Géoportail de Wallonie"});
    const wal22=L.tileLayer.wms("https://geoservices.wallonie.be/arcgis/services/IMAGERIE/ORTHO_2022/MapServer/WMSServer",{layers:"0",format:"image/jpeg",version:"1.3.0",maxZoom:21,attribution:"Orthophotos 2022 © SPW"});
    const picc=L.tileLayer.wms("https://geoservices.wallonie.be/arcgis/services/TOPOGRAPHIE/PICC_VDIFF/MapServer/WMSServer",{layers:"3,4,5,9,10,11,12,13,14,16,21,22,23,24,31,32",format:"image/png",transparent:true,version:"1.3.0",maxZoom:22,attribution:"PICC © SPW — topographie"});
    const pds=L.tileLayer.wms("https://geoservices.wallonie.be/arcgis/services/AMENAGEMENT_TERRITOIRE/PDS/MapServer/WMSServer",{layers:"0",format:"image/png",transparent:true,opacity:.55,version:"1.3.0",attribution:"Plan de secteur © SPW"});
    osm.addTo(map);
    L.control.layers(
      {"Plan (OSM)":osm,"Vue aérienne (Esri)":aer,"Orthophoto Wallonie — dernière (SPW)":wal,"Orthophoto Wallonie 2022 (SPW)":wal22},
      {"PICC — topographie (SPW)":picc,"Plan de secteur (SPW)":pds},
      {position:"topright",collapsed:true}).addTo(map);
    map.on("mousemove",e=>{llRef.current=[e.latlng.lat,e.latlng.lng];setCoord(fmtCoord(coordSysRef.current,e.latlng.lat,e.latlng.lng));});
    const redraw=()=>{const M=measRef.current;if(M.layer){map.removeLayer(M.layer);}if(!M.pts.length){M.layer=null;return;}
      const g=L.layerGroup();
      if(M.mode==="dist"){L.polyline(M.pts,{color:"#CD0947",weight:3}).addTo(g);let d=0;for(let i=1;i<M.pts.length;i++)d+=map.distance(M.pts[i-1],M.pts[i]);setMRes("Distance : "+fmtD(d));}
      else{L.polygon(M.pts,{color:"#CD0947",weight:2,fillColor:"#CD0947",fillOpacity:.15}).addTo(g);setMRes("Surface : "+(M.pts.length<3?"≥ 3 points requis":fmtA(polyArea(M.pts))));}
      M.pts.forEach(pt=>L.circleMarker(pt,{radius:3,color:"#CD0947",fillColor:"#fff",fillOpacity:1,weight:2}).addTo(g));
      g.addTo(map);M.layer=g;};
    map.on("click",e=>{const M=measRef.current;if(!M.mode)return;M.pts.push(e.latlng);redraw();});
    map.on("dblclick",e=>{const M=measRef.current;if(M.mode){L.DomEvent.stop(e);M.mode=null;setMMode(null);map.doubleClickZoom.enable();}});
    mapRef.current=map;setTimeout(()=>map.invalidateSize(),150);
  },[]);
  useEffect(()=>{const map=mapRef.current;if(!map||!cem||!cem.coord)return;
    map.setView(cem.coord,17);setStatus("loading");colorsRef.current={};
    if(layerRef.current){map.removeLayer(layerRef.current);layerRef.current=null;}
    const where=encodeURIComponent(`cimetiere="${cem.nom}"`);
    fetch(`${ODS}namur-cimetieres-emplacements/exports/geojson?where=${where}`)
      .then(r=>r.json()).then(gj=>{
        const seen={};
        const layer=L.geoJSON(gj,{
          style:f=>{const v=(f.properties&&(f.properties[field]??f.properties.type))||"—";seen[v]=colorFor(v);return {color:"#1f2937",weight:.5,fillColor:colorFor(v),fillOpacity:.82};},
          onEachFeature:(f,l)=>{const p=f.properties||{};
            l.bindTooltip(`${p.type||"Emplacement"} — carré ${p.carre||"—"} · n° ${p.numero||"—"}`,{sticky:true});
            l.on("mouseover",()=>{try{l.setStyle({weight:2.5,color:"#CD0947"});}catch(e){}});
            l.on("mouseout",()=>{try{l.setStyle({weight:.5,color:"#1f2937"});}catch(e){}});
            l.on("click",()=>{if(measRef.current.mode)return;onOpen&&onOpen(p);});}
        }).addTo(map);
        layerRef.current=layer;
        try{const b=layer.getBounds();if(b.isValid())map.fitBounds(b,{padding:[18,18]});}catch(e){}
        setLegend(Object.entries(seen).slice(0,14));
        setStatus((gj.features&&gj.features.length)?"ok":"empty");
      }).catch(()=>setStatus("error"));
  },[cem,field]);
  useEffect(()=>{const m=mapRef.current;if(!m)return;
    if(warRef.current){m.removeLayer(warRef.current);warRef.current=null;}
    if(warOn){const g=L.layerGroup();
      WAR_SITES.forEach(s=>{L.circleMarker([s.lat,s.lng],{radius:7,color:"#ffffff",weight:2,fillColor:"#7A271A",fillOpacity:.95}).bindTooltip(`<b>${s.n}</b><br/>${s.t}`,{direction:"top"}).addTo(g);});
      g.addTo(m);warRef.current=g;m.setView(WAR_ANCHOR,18);}
  },[warOn]);
  useEffect(()=>{const m=mapRef.current;if(m&&focus&&focus.coord){m.setView(focus.coord,focus.zoom||18,{animate:true});}},[focus]);
  useEffect(()=>{
    const map=mapRef.current; if(!map||!empl||!empl.features) return;
    if(emplRef.current){try{map.removeLayer(emplRef.current);}catch(e){} emplRef.current=null;}
    selLayerRef.current=null;
    const scoped = cem && cem.id!=="all";
    const feats = empl.features.filter(f=>!scoped || (f.properties&&f.properties.cim_nom===cem.nom));
    if(!feats.length) return;
    const colorFor=(ref)=>{const s=(statutByRef||{})[ref]; return s?((STATUTS[s]||{}).ring||"#64748B"):"#94A3B8";};
    const base=(f)=>({color:"#1e293b",weight:.4,fillColor:colorFor(f.properties&&f.properties.e_emplacement),fillOpacity:.78});
    const layer=L.geoJSON({type:"FeatureCollection",features:feats},{
      renderer:L.canvas(),
      style:base,
      onEachFeature:(f,lyr)=>{const ref=f.properties&&f.properties.e_emplacement; if(!ref)return;
        lyr.bindTooltip(ref,{sticky:true});
        lyr.on("mouseover",()=>{if(lyr!==selLayerRef.current)lyr.setStyle({weight:1.4,color:"#CD0947"});});
        lyr.on("mouseout",()=>{if(lyr!==selLayerRef.current)lyr.setStyle(base(f));});
        lyr.on("click",()=>{
          if(selLayerRef.current&&selLayerRef.current!==lyr&&selLayerRef.current.setStyle){const pf=selLayerRef.current.feature;selLayerRef.current.setStyle(base(pf));}
          lyr.setStyle({weight:3.5,color:"#CD0947",fillOpacity:.9}); if(lyr.bringToFront)lyr.bringToFront();
          selLayerRef.current=lyr;
          const st=(statutByRef||{})[ref]; const stl=(STATUTS[st]||{label:"Libre / sans concession"}).label;
          const el=document.createElement("div"); el.style.font="12px Inter,system-ui,sans-serif";
          el.innerHTML='<div style="font-weight:600;margin-bottom:1px">'+ref+'</div><div style="color:#64748b;margin-bottom:6px">'+stl+'</div>';
          const b=document.createElement("button"); b.textContent="Ouvrir la fiche";
          b.style.cssText="background:#CD0947;color:#fff;border:0;border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer";
          b.onclick=()=>onEmpl&&onEmpl(ref); el.appendChild(b);
          lyr.bindPopup(el).openPopup();
        });
      },
    }).addTo(map);
    emplRef.current=layer;
    try{map.fitBounds(layer.getBounds(),{padding:[20,20],maxZoom:20});}catch(e){}
  },[cem,empl,statutByRef]);
  return(<div className="relative h-full w-full">
    <div ref={elRef} className="h-full w-full" style={{background:"#dfe7da"}}/>
    <div className="absolute left-2 top-2 z-[500] flex items-center gap-1 rounded-md border border-slate-200 bg-white/95 p-1 text-[11px] shadow">
      <Ruler size={13} className="ml-1 text-slate-400"/>
      <button onClick={()=>startMeasure("dist")} className={`rounded px-2 py-1 ${mMode==="dist"?"bg-[#CD0947] text-white":"text-slate-600 hover:bg-slate-100"}`}>Distance</button>
      <button onClick={()=>startMeasure("surf")} className={`rounded px-2 py-1 ${mMode==="surf"?"bg-[#CD0947] text-white":"text-slate-600 hover:bg-slate-100"}`}>Surface</button>
      <button onClick={clearMeasure} className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100">Effacer</button>
      <span className="mx-0.5 h-4 w-px bg-slate-200"/>
      <button onClick={()=>setWarOn(v=>!v)} className={`rounded px-2 py-1 ${warOn?"bg-[#7A271A] text-white":"text-slate-600 hover:bg-slate-100"}`}>⚔ Pelouses d'honneur / carrés militaires</button>
    </div>
    {mRes&&<div className="absolute left-2 top-11 z-[500] rounded-md bg-[#CD0947] px-2.5 py-1 text-[11.5px] font-medium text-white shadow">{mRes}</div>}
    {status==="loading"&&<Badge>Chargement des emplacements — open data Ville de Namur…</Badge>}
    {status==="error"&&<Badge tone="red">Connecte Internet pour charger la carte open data de Namur.</Badge>}
    {status==="empty"&&<Badge tone="amber">Aucun emplacement publié pour « {cem&&cem.nom} ».</Badge>}
    {status==="ok"&&<div className="absolute right-2 top-2 z-[500] rounded-md bg-white/90 px-2.5 py-1 text-[11px] text-slate-600 shadow backdrop-blur"><MousePointer2 size={12} className="mb-0.5 mr-1 inline"/>Cliquez un emplacement pour ouvrir sa fiche</div>}
    {coord&&<div className="pointer-events-none absolute bottom-1 right-2 z-[500] rounded bg-white/90 px-2 py-0.5 font-mono text-[10px] text-slate-500 shadow backdrop-blur">{coord}</div>}
    <div className="absolute bottom-1 left-2 z-[500] flex items-center gap-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] shadow backdrop-blur">
      <span className="text-slate-400">Coord.</span>
      {[["wgs","WGS84"],["dms","DMS"],["l72","Lambert 72"],["l08","Lambert 2008"]].map(([k,l])=>
        <button key={k} onClick={()=>setCoordSys(k)} className={`rounded px-1 ${coordSys===k?"bg-[#CD0947] text-white":"text-slate-500 hover:bg-slate-100"}`}>{l}</button>)}
    </div>
    {legend.length>0&&<div className="absolute bottom-7 left-2 z-[500] max-h-60 w-48 overflow-auto rounded-lg border border-slate-200 bg-white/95 p-2 text-[11px] shadow">
      <div className="mb-1 font-semibold text-slate-600">Thématique : {field}</div>
      {legend.map(([v,c])=><div key={v} className="flex items-center gap-1.5 py-0.5"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{background:c}}/><span className="truncate">{v}</span></div>)}
    </div>}
  </div>);
}

/* ---------- OPEN DATA NAMUR : défunts, emplacements, fiches ---------- */
const ODS1="https://data.namur.be/api/records/1.0/search/";
const pf=(o,ks,d="—")=>{for(const k of ks)if(o&&o[k]!=null&&o[k]!=="")return o[k];return d;};
function useNamur(url){const[st,setSt]=useState("idle");const[data,setData]=useState(null);
  useEffect(()=>{let on=true;if(!url){setSt("idle");return;}setSt("loading");
    fetch(url).then(r=>r.json()).then(j=>{if(!on)return;setData(j);setSt((j.records&&j.records.length)?"ok":"empty");}).catch(()=>{if(on)setSt("error");});
    return ()=>{on=false;};},[url]);
  return {st,data};}
const StatusLine=({st,empty})=>st==="loading"?<p className="p-4 text-[12px] text-slate-400">Chargement des données open data de Namur…</p>:
  st==="error"?<p className="p-4 text-[12px] text-red-600">Connecte Internet pour charger les données de Namur.</p>:
  st==="empty"?<p className="p-4 text-[12px] text-amber-600">{empty||"Aucun résultat."}</p>:null;

function PortailPublicNamur(){
  const [q,setQ]=useState("");const [url,setUrl]=useState(null);const {st,data}=useNamur(url);
  const recs=((data&&data.records)||[]).map(r=>r.fields||{});
  const go=()=>setUrl(q.trim()?`${ODS1}?dataset=namur-cimetieres-defunts&rows=40&q=${encodeURIComponent(q.trim())}`:null);
  return(<div className="h-full overflow-auto bg-gradient-to-b from-slate-100 to-slate-50 p-6"><div className="mx-auto max-w-2xl">
    <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
      <Globe size={22} className="mx-auto text-slate-400"/>
      <h2 className="mt-1 text-[16px] font-semibold text-slate-800">Cimetières de Namur — recherche d'un défunt</h2>
      <p className="text-[12px] text-slate-500">Données officielles · open data Ville de Namur (mises à jour quotidiennement)</p>
      <div className="relative mx-auto mt-3 flex max-w-md gap-2">
        <div className="relative flex-1"><Search size={15} className="pointer-events-none absolute left-3 top-2.5 text-slate-400"/>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="Nom du défunt…" className="w-full rounded-full border border-slate-300 py-2 pl-9 pr-3 text-[13px] outline-none focus:border-[#CD0947]/50"/></div>
        <button onClick={go} className="rounded-full bg-[#CD0947] px-4 py-2 text-[12.5px] font-medium text-white hover:opacity-90">Rechercher</button>
      </div>
    </div>
    <StatusLine st={st} empty="Aucun défunt trouvé dans l'open data de Namur."/>
    <div className="mt-3 space-y-2">{recs.map((f,i)=>{
      const nom=pf(f,["nom","def_nom","nom_defunt"]),prenom=pf(f,["prenom","prenoms","def_prenom"],"");
      const nais=pf(f,["date_naissance","naissance","annee_naissance","an_naissance"]),dec=pf(f,["date_deces","deces","annee_deces","an_deces"]);
      const cim=pf(f,["cimetiere"]),empl=pf(f,["emplacement","empl_nom","numero"]);
      return(<div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded bg-slate-100"><User size={20} className="text-slate-500"/></div>
        <div className="flex-1"><div className="text-[13.5px] font-medium text-slate-800">{nom} {prenom}</div>
          <div className="text-[11.5px] text-slate-500">{nais} – {dec} · {cim} · empl. <span className="font-mono">{empl}</span></div></div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-500">Namur</span>
      </div>);})}</div>
    <p className="mt-3 text-center text-[11px] text-slate-400">Source : data.namur.be · jeux « cimetières-défunts ». Affichage en lecture seule.</p>
  </div></div>);
}

function FicheDefuntsNamur({cem,empl}){
  const url=cem?`${ODS1}?dataset=namur-cimetieres-defunts&rows=30&refine.cimetiere=${encodeURIComponent(cem.nom)}&q=${encodeURIComponent(empl||"")}`:null;
  const {st,data}=useNamur(url);
  const recs=((data&&data.records)||[]).map(r=>r.fields||{});
  return(<div><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Défunts inhumés (open data)</p>
    {st==="loading"&&<p className="text-[12px] text-slate-400">Chargement…</p>}
    {st!=="loading"&&recs.length===0&&<p className="text-[12px] italic text-slate-400">Aucun défunt associé publié.</p>}
    <div className="space-y-1">{recs.map((f,i)=>(<div key={i} className="rounded-md bg-slate-50 p-2 text-[12px]">
      <span className="font-medium text-slate-800">{pf(f,["nom"])} {pf(f,["prenom","prenoms"],"")}</span>
      <span className="ml-2 font-mono text-[11px] text-slate-500">{pf(f,["date_naissance","naissance"])} – {pf(f,["date_deces","deces"])}</span></div>))}</div>
  </div>);
}
function NamurDefuntsByFeature({saphir}){
  const cim=saphir&&saphir.cimetiere;
  const key=saphir&&(saphir.numero||saphir.cim_code||[saphir.carre,saphir.rangee,saphir.numero].filter(Boolean).join(" "));
  const url=cim?`${ODS1}?dataset=namur-cimetieres-defunts&rows=30&refine.cimetiere=${encodeURIComponent(cim)}${key?`&q=${encodeURIComponent(key)}`:""}`:null;
  const {st,data}=useNamur(url);
  const recs=((data&&data.records)||[]).map(r=>r.fields||{});
  return(<div>
    <div className="mb-1.5 flex items-center gap-2"><span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">open data</span><span className="text-[11px] text-slate-400">Défunts réels publiés pour cet emplacement (Ville de Namur)</span></div>
    {st==="loading"&&<p className="text-[12px] text-slate-400">Chargement open data…</p>}
    {st==="error"&&<p className="text-[12px] text-red-500">Connecte Internet pour charger les défunts open data.</p>}
    {(st==="ok"||st==="empty")&&recs.length===0&&<p className="text-[12px] italic text-slate-400">Aucun défunt publié pour cet emplacement.</p>}
    <div className="space-y-1">{recs.map((f,i)=>(<div key={i} className="flex items-center justify-between rounded-md bg-slate-50 px-2.5 py-1.5 text-[12px]">
      <span className="font-medium text-slate-800">{pf(f,["nom","def_nom"])} {pf(f,["prenom","prenoms"],"")}</span>
      <span className="font-mono text-[11px] text-slate-500">{pf(f,["date_naissance","naissance"],"?")} – {pf(f,["date_deces","deces"],"?")}</span></div>))}</div>
  </div>);
}
function SihlFicheModal({f,onClose}){
  const nom=pf(f,["nom","def_nom","nom_defunt"],""),prenom=pf(f,["prenom","prenoms","def_prenom"],"");
  const cat=pf(f,["categorie","theme","parcours","type","intitule","categorie_sihl"],"");
  const bio=pf(f,["bio","biographie","description","texte","resume","histoire","notice","contenu"],"");
  const cim=pf(f,["cimetiere"],""),empl=pf(f,["emplacement","numero","cim_code","alias"],"");
  const lien=pf(f,["lien","url","url_page","page","fiche","lien_page","site"],"");
  const target=lien&&/^https?:/.test(lien)?lien:`https://data.namur.be/explore/dataset/cim-sepultures-sihl-appli/?q=${encodeURIComponent((nom+" "+prenom).trim())}`;
  const qr=qrDataURL(target);
  return(<div className="fixed inset-0 z-[9998] grid place-items-center bg-black/40 p-4" onClick={onClose}>
    <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between bg-[#15222b] px-5 py-3 text-white">
        <div><div className="text-[10px] uppercase tracking-wide text-amber-300">Sépulture d'Importance Historique Locale</div><div className="text-[16px] font-semibold">{nom} {prenom}</div></div>
        <button onClick={onClose}><X size={18} className="text-white/70"/></button>
      </div>
      <div className="grid gap-5 p-5 md:grid-cols-[1fr_160px]">
        <div>
          {cat&&<span className="mb-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-800">{cat}</span>}
          <p className="text-[12.5px] leading-relaxed text-slate-700">{bio||"Notice biographique non renseignée dans le jeu open data. Cette sépulture fait partie des parcours SIHL valorisant les personnalités ayant marqué l'histoire de Namur."}</p>
          <div className="mt-3 space-y-1 text-[12px] text-slate-600">
            {cim&&<div><span className="text-slate-400">Cimetière :</span> {cim}</div>}
            {empl&&<div><span className="text-slate-400">Emplacement :</span> <span className="font-mono">{empl}</span></div>}
            {lien&&<a href={target} target="_blank" rel="noreferrer" className="inline-block text-[#CD0947] hover:underline">Ouvrir la page dédiée ↗</a>}
          </div>
        </div>
        <div className="flex flex-col items-center justify-start rounded-lg border border-slate-200 bg-slate-50 p-3">
          {qr&&<img src={qr} alt="QR" className="h-32 w-32"/>}
          <p className="mt-2 text-center text-[10.5px] text-slate-500">Scannez pour la page dédiée du défunt (parcours QR de la Ville de Namur)</p>
        </div>
      </div>
    </div></div>);
}
function ConcessionsNamur({cem}){
  const url=cem?`${ODS1}?dataset=namur-cimetieres-emplacements&rows=60&refine.cimetiere=${encodeURIComponent(cem.nom)}`:null;
  const {st,data}=useNamur(url);
  const recs=((data&&data.records)||[]).map(r=>r.fields||{});
  const [sel,setSel]=useState(null);
  return(<div className="flex h-full bg-white">
    <div className="min-w-0 flex-1 overflow-auto p-5">
      <h2 className="text-[15px] font-semibold text-slate-800">Emplacements — {cem&&cem.nom}</h2>
      <p className="mb-2 text-[11.5px] text-slate-500">Open data Ville de Namur · jeu « cimetières-emplacements »</p>
      <StatusLine st={st} empty="Aucun emplacement publié pour ce cimetière."/>
      {st==="ok"&&<table className="w-full border-collapse text-[12px]"><thead><tr className="border-b border-slate-200 text-left text-[10.5px] uppercase tracking-wide text-slate-400">
        {["Emplacement","Type","Type spécifique","Carré","Rangée","N°"].map(h=><th key={h} className="px-2 py-2">{h}</th>)}</tr></thead>
        <tbody>{recs.map((f,i)=>(<tr key={i} onClick={()=>setSel(f)} className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${sel===f?"bg-[#CD0947]/5":""}`}>
          <td className="px-2 py-1.5 font-mono font-medium text-slate-800">{pf(f,["emplacement","empl_nom","numero"])}</td>
          <td className="px-2 py-1.5">{pf(f,["type"])}</td><td className="px-2 py-1.5 text-slate-600">{pf(f,["type_specifique"])}</td>
          <td className="px-2 py-1.5 font-mono text-slate-500">{pf(f,["carre"])}</td><td className="px-2 py-1.5 font-mono text-slate-500">{pf(f,["rangee"])}</td><td className="px-2 py-1.5 font-mono text-slate-500">{pf(f,["numero"])}</td>
        </tr>))}</tbody></table>}
    </div>
    {sel&&<aside className="w-80 shrink-0 overflow-auto border-l border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center justify-between"><span className="font-mono text-[14px] font-semibold text-slate-900">{pf(sel,["emplacement","empl_nom","numero"])}</span><button onClick={()=>setSel(null)}><X size={16} className="text-slate-400"/></button></div>
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <KV k="Cimetière" v={pf(sel,["cimetiere"])}/><KV k="Type" v={pf(sel,["type"])}/><KV k="Type spécifique" v={pf(sel,["type_specifique"])}/>
        <KV k="Carré" v={pf(sel,["carre"])} mono/><KV k="Rangée" v={pf(sel,["rangee"])} mono/><KV k="Numéro" v={pf(sel,["numero"])} mono/>
      </div>
      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3"><FicheDefuntsNamur cem={cem} empl={pf(sel,["emplacement","empl_nom","numero"],"")}/></div>
    </aside>}
  </div>);
}
function PatrimoineNamur({cem}){
  const url=cem?`${ODS1}?dataset=namur-cimetieres-emplacements&rows=80&refine.cimetiere=${encodeURIComponent(cem.nom)}`:null;
  const {st,data}=useNamur(url);
  const kw=["honneur","militaire","combattant","guerre","historique","patrimoine"];
  const recs=((data&&data.records)||[]).map(r=>r.fields||{}).filter(f=>{const s=((pf(f,["type"],"")+" "+pf(f,["type_specifique"],""))).toLowerCase();return kw.some(k=>s.includes(k));});
  return(<div className="p-6">
    <h2 className="text-[15px] font-semibold text-slate-800">Patrimoine — sépultures remarquables (open data)</h2>
    <p className="mb-2 text-[11.5px] text-slate-500">Emplacements de type « honneur / militaire / historique » dans {cem&&cem.nom}. Namur ne publie pas de couche SIHL dédiée : l'inventaire SIHL reste administratif (onglet « Encoder une SIHL »).</p>
    <StatusLine st={st} empty=" "/>
    {st!=="loading"&&recs.length===0&&<p className="text-[12px] italic text-slate-400">Aucun emplacement « honneur/militaire » détecté dans ce cimetière via l'open data.</p>}
    <div className="mt-2 grid gap-2 md:grid-cols-2">{recs.map((f,i)=>(<div key={i} className="rounded-xl border border-orange-200 bg-white p-3">
      <div className="font-mono text-[12.5px] font-semibold text-slate-900">{pf(f,["emplacement","numero"])}</div>
      <div className="text-[12px] text-slate-700">{pf(f,["type"])} · {pf(f,["type_specifique"])}</div>
      <div className="text-[11px] text-slate-400">Carré {pf(f,["carre"])} · Rangée {pf(f,["rangee"])}</div></div>))}</div>
  </div>);
}

/* ---------- BARRE DE FILTRES (étendue) ---------- */
const FILTER_DEFAULT={cim:"Tous",ref:"",allee:"",nature:"Toutes",statut:"Tous",duree:"Toutes",typePers:"Toutes",nom:"",prenom:"",denom1:"",denom2:"",nn:"",lieuNaiss:"",anneeNaiss:"",anneeDeces:"",concessionnaire:"",beneficiaire:"",octroiDe:"",octroiA:"",expDe:"",expA:"",sihlCat:"",pf:"",marbrier:""};
function _yy(s){const m=(""+s).match(/(\d{4})/);return m?+m[1]:null;}
function _ic(h,n){return (""+(h||"")).toLowerCase().includes((""+n).toLowerCase());}
function _norm(s){return (""+(s||"")).trim().toLowerCase().replace(/\s+/g," ");}
function matchRec(r,v){if(!r)return false;
  if(v.cim!=="Tous"&&_norm(r.cimetiere)!==_norm(v.cim))return false;
  if(v.ref&&!_ic(r.ref,v.ref))return false;
  if(v.allee&&!_ic((r.ref||"").split("/")[0],v.allee))return false;
  if(v.nature!=="Toutes"&&r.nature!==v.nature)return false;
  if(v.statut!=="Tous"&&r.statut!==v.statut)return false;
  if(v.duree!=="Toutes"&&!_ic(r.duree,v.duree.replace(" ans","")))return false;
  const resp=(r.personnes&&r.personnes.responsable&&r.personnes.responsable[0])||{};
  const benefs=(r.personnes&&r.personnes.beneficiaire)||[];const inh=r.inhumes||[];
  if(v.nom){const pool=[];const tp=v.typePers;
    if(tp==="Toutes"||tp==="Concessionnaire")pool.push(resp.nom);
    if(tp==="Toutes"||tp==="Bénéficiaire")benefs.forEach(b=>pool.push(b.nom));
    if(tp==="Toutes"||tp==="Défunt")inh.forEach(x=>pool.push(x.nom));
    if(!pool.some(n=>_ic(n,v.nom)))return false;}
  if(v.prenom&&![resp.prenom,...inh.map(x=>x.nom)].some(n=>_ic(n,v.prenom)))return false;
  if(v.denom1&&!_ic(r.denom1,v.denom1))return false;
  if(v.denom2&&!_ic(r.denom2,v.denom2))return false;
  if(v.nn&&!_ic(resp.nn,v.nn))return false;
  if(v.lieuNaiss&&!_ic(resp.lieu,v.lieuNaiss))return false;
  if(v.anneeNaiss&&![_yy(resp.naissance),...inh.map(x=>_yy(x.naissance))].includes(+v.anneeNaiss))return false;
  if(v.anneeDeces&&!inh.map(x=>_yy(x.deces)).includes(+v.anneeDeces))return false;
  if(v.concessionnaire&&!_ic(resp.nom,v.concessionnaire))return false;
  if(v.beneficiaire&&!benefs.some(b=>_ic(b.nom,v.beneficiaire)))return false;
  const oy=_yy(r.octroi);if(v.octroiDe&&(!oy||oy<+v.octroiDe))return false;if(v.octroiA&&(!oy||oy>+v.octroiA))return false;
  const ey=_yy(r.expiration);if(v.expDe&&(!ey||ey<+v.expDe))return false;if(v.expA&&(!ey||ey>+v.expA))return false;
  if(v.sihlCat&&!(_ic(r.sihl&&r.sihl.categorie,v.sihlCat)||(r.nature==="sihl"&&_ic("sihl",v.sihlCat))))return false;
  if(v.pf&&!inh.some(x=>_ic(x.pf,v.pf)))return false;
  if(v.marbrier&&!_ic(r.monument&&r.monument.placeur,v.marbrier))return false;
  return true;}
function filterActive(v){return Object.keys(FILTER_DEFAULT).some(k=>{const x=v[k];return x&&x!=="Tous"&&x!=="Toutes";});}
function FilterFields({val,setVal,onEnter}){
  const up=(k,v)=>setVal(s=>({...s,[k]:v}));
  const cims=["Tous",...CEMETERIES.map(c=>c.nom)];
  const TextF=({k,label,icon,w="140px"})=>(<div className="flex flex-1 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11.5px]" style={{minWidth:w}}><span className="text-slate-400">{icon}</span><input value={val[k]} onChange={e=>up(k,e.target.value)} onKeyDown={e=>e.key==="Enter"&&onEnter&&onEnter()} placeholder={label} className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400"/></div>);
  const SelF=({k,icon,opts})=>(<div className="flex min-w-[140px] flex-1 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[11.5px] text-slate-600"><span className="text-slate-400">{icon}</span><select value={val[k]} onChange={e=>up(k,e.target.value)} className="w-full bg-transparent outline-none">{opts.map(o=><option key={o.v??o} value={o.v??o}>{o.l??o}</option>)}</select></div>);
  const Range=({a,b,label,icon})=>(<div className="flex min-w-[170px] flex-1 items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11.5px] text-slate-500"><span className="text-slate-400">{icon}</span><span className="whitespace-nowrap text-[10.5px] text-slate-400">{label}</span><input value={val[a]} onChange={e=>up(a,e.target.value)} placeholder="de" className="w-12 bg-transparent text-slate-700 outline-none placeholder:text-slate-300"/><span className="text-slate-300">–</span><input value={val[b]} onChange={e=>up(b,e.target.value)} placeholder="à" className="w-12 bg-transparent text-slate-700 outline-none placeholder:text-slate-300"/></div>);
  return(<>
    <SelF k="cim" icon={<MapPin size={13}/>} opts={cims}/>
    <TextF k="ref" label="N° de concession" icon={<Hash size={13}/>}/>
    <TextF k="allee" label="Allée / rangée" icon={<Map size={13}/>}/>
    <SelF k="nature" icon={<Layers size={13}/>} opts={["Toutes",...Object.entries(NATURES).map(([v,n])=>({v,l:n.label}))]}/>
    <SelF k="statut" icon={<Filter size={13}/>} opts={["Tous",...Object.entries(STATUTS).map(([v,s])=>({v,l:s.label}))]}/>
    <SelF k="duree" icon={<Clock size={13}/>} opts={["Toutes","15 ans","30 ans","50 ans","Perpétuelle"]}/>
    <SelF k="typePers" icon={<User size={13}/>} opts={["Toutes","Concessionnaire","Bénéficiaire","Défunt"]}/>
    <TextF k="nom" label="Nom" icon={<User size={13}/>}/>
    <TextF k="prenom" label="Prénom" icon={<User size={13}/>}/>
    <TextF k="denom1" label="Dénomination (1)" icon={<FileText size={13}/>}/>
    <TextF k="denom2" label="Dénomination (2)" icon={<FileText size={13}/>}/>
    <TextF k="nn" label="N° national" icon={<Hash size={13}/>}/>
    <TextF k="lieuNaiss" label="Lieu de naissance" icon={<MapPin size={13}/>}/>
    <TextF k="anneeNaiss" label="Année de naissance" icon={<Calendar size={13}/>} w="120px"/>
    <TextF k="anneeDeces" label="Année de décès" icon={<Calendar size={13}/>} w="120px"/>
    <TextF k="concessionnaire" label="Concessionnaire" icon={<User size={13}/>}/>
    <TextF k="beneficiaire" label="Bénéficiaire" icon={<Users size={13}/>}/>
    <Range a="octroiDe" b="octroiA" label="Octroi" icon={<Calendar size={13}/>}/>
    <Range a="expDe" b="expA" label="Expiration" icon={<Calendar size={13}/>}/>
    <TextF k="sihlCat" label="Catégorie SIHL" icon={<Landmark size={13}/>}/>
    <TextF k="pf" label="Pompes funèbres" icon={<Inbox size={13}/>}/>
    <TextF k="marbrier" label="Marbrier" icon={<Hammer size={13}/>}/>
  </>);
}
function FilterBar({val,setVal,results,onLocate,onReset}){
  const [open,setOpen]=useState(true);
  const [showRes,setShowRes]=useState(false);
  return(<div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
    <button onClick={()=>setOpen(!open)} className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400"><Filter size={13}/>Filtres & recherche {open?<ChevronDown size={13}/>:<ChevronRight size={13}/>}</button>
    {open&&<div className="flex flex-wrap items-center gap-2">
      <FilterFields val={val} setVal={setVal} onEnter={()=>setShowRes(true)}/>
      <button onClick={()=>setShowRes(true)} className="flex items-center gap-1 rounded-md bg-[#CD0947] px-3 py-1.5 text-[11.5px] font-medium text-white hover:opacity-90"><Search size={13}/>Rechercher ({results.length})</button>
      <button onClick={()=>{onReset();setShowRes(false);}} className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[11.5px] text-slate-600 hover:bg-slate-100">Réinitialiser</button>
      {showRes&&<div className="relative">
        <div className="absolute right-0 top-1 z-[1000] max-h-72 w-80 overflow-auto rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-500">{results.length} résultat(s) — cliquez pour localiser<button onClick={()=>setShowRes(false)}><X size={13} className="text-slate-400"/></button></div>
          {results.length===0&&<p className="p-3 text-[12px] italic text-slate-400">Aucune concession ne correspond.</p>}
          {results.slice(0,80).map(r=>(<button key={r.ref} onClick={()=>{onLocate(r);setShowRes(false);}} className="flex w-full items-center justify-between border-b border-slate-50 px-3 py-1.5 text-left hover:bg-slate-50">
            <span><span className="font-mono text-[12px] font-medium text-slate-800">{r.ref}</span> <span className="text-[11.5px] text-slate-500">{r.denom1}</span></span>
            <span className="ml-2 shrink-0 text-[10.5px] text-slate-400">{r.cimetiere}</span>
          </button>))}
        </div>
      </div>}
    </div>}
  </div>);
}

/* ---------- ARBRE DE COUCHES (Thématiques) ---------- */
function LayerTree({thematique,setThematique,onCreate}){
  const [vis,setVis]=useState({desaffect:true,expir:true,dispo:true,nonid:true});
  const tg=k=>setVis(s=>({...s,[k]:!s[k]}));
  const layers=[["desaffect","Concessions désaffectées","#8E7CC3"],["expir","Concessions expirées","#E6C229"],["dispo","Concessions disponibles","#2E971F"],["nonid","Concessions non identifiées","#4F5B62"]];
  const Head=({label,open=true,bold})=>(<div className="flex items-center justify-between border-b border-slate-100 px-3 py-2"><span className={`flex items-center gap-2 ${bold?"font-semibold text-slate-700":"text-slate-600"}`}><Folder size={14} className="text-slate-400"/>{label}</span><ChevronDown size={14} className="text-slate-300"/></div>);
  return(<div className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white text-[12.5px]">
    <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-slate-400"><Layers size={14}/>Gestion des couches</div>
    <div className="flex-1 overflow-y-auto">
      <Head label="Cimsystem" bold/>
      <Head label="Thématiques" bold/>
      <div className="border-b border-slate-100 px-3 py-2">
        <div className="mb-1.5 flex items-center gap-2 text-slate-600"><Palette size={13} className="text-slate-400"/>Colorer par</div>
        <select value={thematique} onChange={e=>setThematique(e.target.value)} className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-[12px] outline-none focus:border-[#CD0947]/50">
          <option value="nature">Natures</option><option value="statut">États</option><option value="echeance">Échéances</option><option value="duree">Durées</option>
        </select>
      </div>
      {layers.map(([k,label,c])=>(<button key={k} onClick={()=>tg(k)} className="flex w-full items-center gap-2 border-b border-slate-50 px-3 py-2 text-left hover:bg-slate-50">
        <span className="h-3.5 w-3.5 rounded-full border-2" style={{borderColor:c,background:vis[k]?c:"transparent"}}/>
        <span className={`flex-1 truncate ${vis[k]?"text-slate-700":"text-slate-400"}`}>{label}</span>
        {vis[k]?<Eye size={14} className="text-slate-400"/>:<EyeOff size={14} className="text-slate-300"/>}</button>))}
      <Head label="Namur"/>
    </div>
    <div className="border-t border-slate-100 p-3">
      <button onClick={onCreate} className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#CD0947] py-2 text-[12px] font-medium text-white hover:opacity-90"><PlusSquare size={14}/>Créer un emplacement</button>
    </div>
  </div>);
}

/* ---------- DOCUMENTS (actes & autorisations) ---------- */
function DocPreview({doc}){
  const bodies={
    inhumer:["Le Collège communal autorise l'inhumation de la dépouille mortelle ci-après désignée, dans le cimetière communal indiqué.","Défunt : Henri DELVAUX — décédé le 20/06/2026 à Namur.","Cimetière de Belgrade — concession ALM/T4 — inhumation en pleine terre.","Le présent permis est délivré sous réserve du respect des prescriptions de police des funérailles."],
    exhumer:["Le Collège communal autorise l'exhumation de la dépouille mortelle ci-après, pour le motif indiqué (exhumation de confort / technique / judiciaire).","Défunt : — · Concession : CHE/T7 · Cimetière de Belgrade.","L'exhumation est subordonnée au respect du délai sanitaire et, le cas échéant, à l'autorisation requise.","Présence obligatoire d'un délégué communal et des mesures d'hygiène prescrites."],
    ossuaire:["Suite à la désaffectation de la concession, le Collège communal autorise le transfert des restes mortels vers l'ossuaire communal.","Concession d'origine : ALM/T17 · Cimetière de Belgrade.","Les restes sont déposés dans l'ossuaire dans le respect de la dignité due aux défunts.","Mention portée au registre des reprises et au registre de l'ossuaire."],
    cremation:["Le Collège communal / l'officier de l'état civil autorise la crémation de la dépouille mortelle désignée ci-dessus.","Conformément à l'AR du 19/01/1973 et aux dernières volontés du défunt.","Destination des cendres : à préciser (inhumation d'urne, dispersion, conservation)."],
    dispersion:["Autorisation de dispersion des cendres sur l'aire de dispersion du cimetière de Belgrade.","La dispersion est inscrite au registre des cendres tenu par le gestionnaire."],
    transport:["Autorisation de transport du corps entre communes / vers l'établissement crématoire, selon les règles de police des funérailles."],
    titre:["Titre de concession délivré au concessionnaire pour la sépulture désignée, pour la durée et aux conditions du règlement communal."],
    echeance:["Avis adressé à l'ayant droit l'informant de l'échéance prochaine de la concession et de la possibilité de renouvellement (CDLD art. L1232-12 §2)."],
    sihl1945:["Demande adressée à la Cellule de gestion du patrimoine funéraire (SPW IAS) en vue de l'enlèvement ou du déplacement d'une sépulture érigée avant 1945.","Référence : AGW du 29/10/2009, art. 44. Toute reprise de signes indicatifs est subordonnée à cette autorisation.","Sépulture concernée : ALM/H1 — Caporal Henri DELVAUX (1918)."],
  };
  return(<div className="mx-auto max-w-2xl">
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div><div className="text-[12px] font-semibold text-slate-800">Commune de Namur</div><div className="text-[10.5px] text-slate-500">Service Population — État civil & Cimetières</div></div>
        <Stamp size={26} className="text-slate-300"/>
      </div>
      <h1 className="mt-4 text-center text-[17px] font-bold uppercase tracking-wide text-slate-900">{doc.nom}</h1>
      <p className="mb-3 text-center text-[11px] text-slate-400">Base légale : {doc.base}</p>
      <div className="space-y-2 text-[12.5px] leading-relaxed text-slate-700">{(bodies[doc.k]||["Document généré automatiquement à partir du dossier de concession."]).map((t,i)=><p key={i}>{t}</p>)}</div>
      <div className="mt-8 flex items-end justify-between">
        <div className="text-[11.5px] text-slate-500">Fait à Namur, le 23/06/2026</div>
        <div className="text-center"><div className="mb-6 text-[11px] text-slate-400">Par le Collège,</div><div className="border-t border-slate-300 px-8 pt-1 text-[11px] text-slate-500">Le Directeur général</div></div>
      </div>
    </div>
    <div className="mt-3 flex gap-2"><button onClick={()=>{const ok=genPdf(doc.nom,doc.base,DOC_BODIES[doc.k]||["Document généré depuis le dossier."],doc.k+".pdf");toast(ok?"PDF généré et téléchargé":"Aperçu PDF indisponible");}} className="flex items-center gap-1.5 rounded-md bg-[#CD0947] px-4 py-2 text-[13px] font-medium text-white hover:opacity-90"><FileCheck2 size={15}/>Générer le PDF</button><button onClick={()=>{toast("Impression…");window.print();}} className="flex items-center gap-1.5 rounded-md border border-slate-300 px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-100"><Printer size={15}/>Imprimer</button></div>
  </div>);
}
/* ---------- modèles à champs de fusion ---------- */
const DEFAULT_TPL={
  inhumer:`Le Collège communal autorise l'inhumation de {{defunt.nom}}, né(e) le {{defunt.naissance}}, décédé(e) le {{defunt.deces}}.\n\nLieu : cimetière de {{concession.cimetiere}} — concession {{concession.ref}} ({{concession.nature}}).\nPompes funèbres : {{defunt.pf}}.\n\nLe présent permis est délivré sous réserve du respect des prescriptions de police des funérailles.`,
  exhumer:`Le Collège communal autorise l'exhumation de {{defunt.nom}} (décès le {{defunt.deces}}).\n\nConcession {{concession.ref}} — cimetière de {{concession.cimetiere}}.\nL'exhumation est subordonnée au respect du délai sanitaire et aux autorisations requises.`,
  ossuaire:`Suite à la désaffectation de la concession {{concession.ref}} ({{concession.cimetiere}}), le Collège communal autorise le transfert des restes mortels vers l'ossuaire communal.\n\nMention portée au registre des reprises et de l'ossuaire.`,
  cremation:`Le Collège communal autorise la crémation de {{defunt.nom}}, décédé(e) le {{defunt.deces}}, conformément à l'AR du 19/01/1973 et aux dernières volontés du défunt.`,
  dispersion:`Autorisation de dispersion des cendres de {{defunt.nom}} sur l'aire de dispersion du cimetière de {{concession.cimetiere}}.\nInscription au registre des cendres.`,
  transport:`Autorisation de transport du corps de {{defunt.nom}} selon les règles de police des funérailles.`,
  titre:`Titre de concession {{concession.ref}} délivré à {{concessionnaire.nom}} ({{concessionnaire.adresse}}).\n\nNature : {{concession.nature}} — Durée : {{concession.duree}} — Octroi : {{concession.octroi}} — Échéance : {{concession.expiration}}.`,
  echeance:`Avis à {{concessionnaire.nom}} : la concession {{concession.ref}} ({{concession.cimetiere}}) arrive à échéance le {{concession.expiration}}.\n\nUn renouvellement est possible (CDLD art. L1232-12 §2). Sans réaction, la procédure de reprise pourra être engagée.`,
  sihl1945:`Demande à la Cellule du patrimoine funéraire (SPW IAS) — enlèvement / déplacement de la sépulture {{concession.ref}} érigée avant 1945.\n\nRéférence : AGW 29/10/2009, art. 44. Défunt : {{defunt.nom}}.`,
};
const MERGE_FIELDS=[
  ["{{commune}}","Commune"],["{{date}}","Date du jour"],["{{gestionnaire}}","Gestionnaire"],
  ["{{concession.ref}}","Réf. concession"],["{{concession.cimetiere}}","Cimetière"],["{{concession.nature}}","Nature"],
  ["{{concession.denom1}}","Dénomination"],["{{concession.duree}}","Durée"],["{{concession.octroi}}","Octroi"],["{{concession.expiration}}","Échéance"],
  ["{{concessionnaire.nom}}","Concessionnaire"],["{{concessionnaire.adresse}}","Adresse"],
  ["{{defunt.nom}}","Défunt"],["{{defunt.naissance}}","Naissance"],["{{defunt.deces}}","Décès"],["{{defunt.inhum}}","Inhumation"],["{{defunt.pf}}","Pompes fun."],
];
function buildMergeData(rec){
  const c=rec||{};const inh=(c.inhumes&&c.inhumes[0])||{};
  const conc=(c.personnes&&c.personnes.concessionnaire&&c.personnes.concessionnaire[0])||{};
  return {
    "commune":"Namur","date":"23/06/2026","gestionnaire":"Philippe Baijot",
    "concession.ref":c.ref||"","concession.cimetiere":c.cimetiere||"Belgrade",
    "concession.nature":(NATURES[c.nature]&&NATURES[c.nature].label)||c.nature||"",
    "concession.denom1":c.denom1||"","concession.duree":c.duree||"","concession.octroi":c.octroi||"","concession.expiration":c.expiration||"",
    "concessionnaire.nom":conc.nom||"","concessionnaire.adresse":conc.adresse||"",
    "defunt.nom":inh.nom||"","defunt.naissance":inh.naissance||"","defunt.deces":inh.deces||"","defunt.inhum":inh.inhum||"","defunt.pf":inh.pf||"",
  };
}
function mergeText(tpl,data){return String(tpl||"").replace(/\{\{\s*([\w.]+)\s*\}\}/g,(m,k)=>{const v=data[k];return (v===undefined||v==="")?("«"+k+"»"):v;});}
function DocPaper({doc,paragraphs}){
  return(<div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
      <div><div className="text-[12px] font-semibold text-slate-800">Commune de Namur</div><div className="text-[10.5px] text-slate-500">Service Population — État civil & Cimetières</div></div>
      <Stamp size={26} className="text-slate-300"/></div>
    <h1 className="mt-4 text-center text-[17px] font-bold uppercase tracking-wide text-slate-900">{doc.nom}</h1>
    <p className="mb-3 text-center text-[11px] text-slate-400">Base légale : {doc.base}</p>
    <div className="space-y-2 whitespace-pre-wrap text-[12.5px] leading-relaxed text-slate-700">{paragraphs.map((t,i)=><p key={i}>{t}</p>)}</div>
    <div className="mt-8 flex items-end justify-between"><div className="text-[11.5px] text-slate-500">Fait à Namur, le 23/06/2026</div>
      <div className="text-center"><div className="mb-6 text-[11px] text-slate-400">Par le Collège,</div><div className="border-t border-slate-300 px-8 pt-1 text-[11px] text-slate-500">Le Directeur général</div></div></div>
  </div>);
}
function Documents({records}){
  records=records||{};
  const refs=Object.keys(records);
  const [sel,setSel]=useState("inhumer");
  const [recRef,setRecRef]=useState(refs[0]||"");
  const [tpls,setTpls]=useState(DEFAULT_TPL);
  const [editing,setEditing]=useState(false);
  const taRef=useRef(null);
  const cur=DOC_TYPES.find(d=>d.k===sel)||DOC_TYPES[0];
  const data=buildMergeData(records[recRef]);
  const tpl=tpls[sel]||"";
  const paragraphs=mergeText(tpl,data).split(/\n{2,}/);
  const insert=(tag)=>{const ta=taRef.current;const v=tpls[sel]||"";
    if(!ta){setTpls(t=>({...t,[sel]:v+tag}));return;}
    const s=ta.selectionStart,e=ta.selectionEnd;const nv=v.slice(0,s)+tag+v.slice(e);
    setTpls(t=>({...t,[sel]:nv}));requestAnimationFrame(()=>{try{ta.focus();ta.selectionStart=ta.selectionEnd=s+tag.length;}catch(x){}});};
  return(<div className="flex h-full bg-slate-50">
    <div className="w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3">
      <h2 className="px-1 text-[14px] font-semibold text-slate-800">Documents & modèles</h2>
      <p className="mb-2 px-1 text-[11px] text-slate-500">Actes à champs de fusion, générés depuis la base.</p>
      {DOC_TYPES.map(d=>(<button key={d.k} onClick={()=>setSel(d.k)} className={`mb-1 flex w-full items-center gap-2.5 rounded-md border p-2.5 text-left ${sel===d.k?"border-[#CD0947] bg-[#CD0947]/5":"border-slate-200 hover:bg-slate-50"}`}>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-white" style={{background:d.c}}><FileText size={15}/></span>
        <span><span className="block text-[12.5px] font-medium text-slate-800">{d.nom}</span><span className="block text-[10.5px] text-slate-400">{d.base}</span></span></button>))}
    </div>
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <span className="text-[11px] text-slate-500">Fusionner depuis :</span>
        <select value={recRef} onChange={e=>setRecRef(e.target.value)} className="max-w-[280px] rounded-md border border-slate-300 px-2 py-1.5 text-[12px] outline-none focus:border-[#CD0947]/50">
          {refs.slice(0,300).map(r=>{const rc=records[r];return <option key={r} value={r}>{r} — {rc&&rc.denom1}</option>;})}
        </select>
        <div className="ml-auto flex gap-2">
          <button onClick={()=>setEditing(!editing)} className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-[12px] text-slate-700 hover:bg-slate-100">{editing?<><Eye size={14}/>Aperçu fusionné</>:<><SquarePen size={14}/>Modifier le modèle</>}</button>
          {editing&&<button onClick={()=>{setEditing(false);toast("Modèle enregistré");}} className="flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-slate-700"><Save size={14}/>Enregistrer le modèle</button>}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-6"><div className="mx-auto max-w-2xl">
        {editing?<>
          <div className="mb-2 rounded-lg border border-slate-200 bg-white p-2.5">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Champs de fusion — cliquer pour insérer</div>
            <div className="flex flex-wrap gap-1.5">{MERGE_FIELDS.map(([tag,label])=><button key={tag} onClick={()=>insert(tag)} title={label} className="rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-[#CD0947] hover:bg-[#CD0947]/10">{tag}</button>)}</div>
          </div>
          <textarea ref={taRef} value={tpl} onChange={e=>setTpls(t=>({...t,[sel]:e.target.value}))} className="h-72 w-full rounded-lg border border-slate-300 p-3 font-mono text-[12.5px] leading-relaxed outline-none focus:border-[#CD0947]/50"/>
          <p className="mt-1.5 text-[11px] text-slate-400">Tapez du texte libre + insérez des champs comme <span className="font-mono">{"{{defunt.nom}}"}</span>. L'aperçu les remplace par les données de la concession choisie.</p>
        </>:<>
          <DocPaper doc={cur} paragraphs={paragraphs}/>
          <div className="mt-3 flex gap-2">
            <button onClick={()=>{const ok=genPdf(cur.nom,cur.base,paragraphs,cur.k+".pdf");toast(ok?"PDF fusionné généré et téléchargé":"Aperçu PDF indisponible");}} className="flex items-center gap-1.5 rounded-md bg-[#CD0947] px-4 py-2 text-[13px] font-medium text-white hover:opacity-90"><FileCheck2 size={15}/>Générer le PDF</button>
            <button onClick={()=>{toast("Impression…");window.print();}} className="flex items-center gap-1.5 rounded-md border border-slate-300 px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-100"><Printer size={15}/>Imprimer</button>
          </div>
        </>}
      </div></div>
    </div>
  </div>);
}

/* ---------- FORMULAIRE ANCIENS COMBATTANTS / VICTIMES DE GUERRE ---------- */
function AnciensCombattantsForm(){
  return(<FormPage icon={<Landmark size={18}/>} title="Sépulture d'ancien combattant / victime de guerre" submitLabel="Enregistrer (SIHL d'office)"
    subtitle="SIHL d'office — AGW 29/10/2009, art. 41 : toute sépulture d'une victime de guerre, civile ou militaire.">
    <Sub>Identité</Sub><Grid3>
      <Field label="Nom"><Inp defaultValue="DELVAUX"/></Field><Field label="Prénom(s)"><Inp defaultValue="Henri"/></Field><Field label="Concession (réf.)"><Inp defaultValue="ALM/H1"/></Field>
    </Grid3>
    <Sub>Données militaires</Sub><Grid3>
      <Field label="Conflit"><Sel><option>1914-1918</option><option>1940-1945</option><option>Autre conflit</option><option>Victime civile</option></Sel></Field>
      <Field label="Grade"><Inp defaultValue="Caporal"/></Field><Field label="Unité / régiment"><Inp defaultValue="2ᵉ régiment de ligne"/></Field>
      <Field label="Date de décès"><Inp type="date" defaultValue="1918-11-04"/></Field><Field label="Lieu"><Inp defaultValue="Front de l'Yser"/></Field>
      <Field label="Matricule"><Inp defaultValue="—"/></Field>
      <Field label="Mention « Mort pour la Belgique »"><Sel><option>Oui</option><option>Non</option></Sel></Field>
      <Field label="Pelouse d'honneur"><Sel><option>Oui</option><option>Non</option></Sel></Field>
    </Grid3>
    <Sub>Sépulture antérieure à 1945 (art. 44)</Sub>
    <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-[11.5px] text-amber-900"><AlertTriangle size={13} className="mr-1 inline"/>Pour une sépulture érigée avant 1945, tout enlèvement ou déplacement des signes indicatifs est soumis à l'autorisation préalable de la Cellule de gestion du patrimoine funéraire (SPW IAS).</div>
    <Grid3>
      <Field label="Sépulture antérieure à 1945 ?"><Sel><option>Oui</option><option>Non</option></Sel></Field>
      <Field label="N° de dossier SPW IAS"><Inp placeholder="le cas échéant"/></Field>
      <Field label="Date de la demande SPW"><Inp type="date"/></Field>
    </Grid3>
    <Sub>Publication</Sub><Grid3>
      <Field label="Publier sur le portail public"><Sel><option>Oui</option><option>Non</option></Sel></Field>
      <Field label="Notice publique" full><Txt defaultValue="Caporal au 2ᵉ régiment de ligne, mort pour la Belgique en novembre 1918."/></Field>
    </Grid3>
  </FormPage>);
}

/* ---------- notifications + génération PDF + édition dossier ---------- */
function toast(msg){window.dispatchEvent(new CustomEvent("cim-toast",{detail:msg}));}
function Toaster(){
  const [msgs,setMsgs]=useState([]);
  useEffect(()=>{const h=e=>{const id=Date.now()+Math.random();setMsgs(m=>[...m,{id,msg:e.detail}]);setTimeout(()=>setMsgs(m=>m.filter(x=>x.id!==id)),2800);};
    window.addEventListener("cim-toast",h);return()=>window.removeEventListener("cim-toast",h);},[]);
  return <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] space-y-2">{msgs.map(m=>(
    <div key={m.id} className="flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2.5 text-[12.5px] text-white shadow-lg"><CheckCircle2 size={15} className="text-green-400"/>{m.msg}</div>))}</div>;
}
function genPdf(title,base,lines,filename){
  try{
    const d=new jsPDF({unit:"pt",format:"a4"});const L=56,R=539;let y=60;
    d.setFont("helvetica","bold");d.setFontSize(11);d.text("Commune de Namur",L,y);
    d.setFont("helvetica","normal");d.setFontSize(9);d.setTextColor(110);y+=14;d.text("Service Population — État civil & Cimetières",L,y);
    d.setTextColor(40);d.setLineWidth(.5);y+=10;d.line(L,y,R,y);
    y+=36;d.setFont("helvetica","bold");d.setFontSize(15);d.text((title||"").toUpperCase(),297,y,{align:"center"});
    y+=18;d.setFont("helvetica","normal");d.setFontSize(9);d.setTextColor(120);d.text("Base légale : "+(base||"—"),297,y,{align:"center"});
    d.setTextColor(40);y+=28;d.setFontSize(11);
    (lines||[]).forEach(t=>{const w=d.splitTextToSize(t,R-L);d.text(w,L,y);y+=w.length*15+6;});
    y=Math.max(y,640)+30;d.setFontSize(10);d.text("Fait à Namur, le 23/06/2026",L,y);
    d.text("Par le Collège,",400,y);d.text("Le Directeur général",400,y+42);d.line(400,y+30,R,y+30);
    d.save(filename||"document.pdf");return true;
  }catch(e){return false;}
}
const DOC_BODIES={
  inhumer:["Le Collège communal autorise l'inhumation de la dépouille mortelle ci-après désignée, dans le cimetière communal indiqué.","Défunt : Henri DELVAUX — décédé le 20/06/2026 à Namur.","Cimetière de Belgrade — concession ALM/T4 — inhumation en pleine terre.","Le présent permis est délivré sous réserve du respect des prescriptions de police des funérailles."],
  exhumer:["Le Collège communal autorise l'exhumation de la dépouille mortelle ci-après, pour le motif indiqué.","Concession : CHE/T7 · Cimetière de Belgrade.","L'exhumation est subordonnée au respect du délai sanitaire et aux autorisations requises.","Présence obligatoire d'un délégué communal et des mesures d'hygiène prescrites."],
  ossuaire:["Suite à la désaffectation de la concession, le Collège communal autorise le transfert des restes mortels vers l'ossuaire communal.","Concession d'origine : ALM/T17 · Cimetière de Belgrade.","Mention portée au registre des reprises et au registre de l'ossuaire."],
  cremation:["Le Collège communal autorise la crémation de la dépouille mortelle désignée ci-dessus.","Conformément à l'AR du 19/01/1973 et aux dernières volontés du défunt."],
  dispersion:["Autorisation de dispersion des cendres sur l'aire de dispersion du cimetière de Belgrade.","La dispersion est inscrite au registre des cendres."],
  transport:["Autorisation de transport du corps selon les règles de police des funérailles."],
  titre:["Titre de concession délivré au concessionnaire pour la sépulture désignée, aux conditions du règlement communal."],
  echeance:["Avis informant l'ayant droit de l'échéance prochaine de la concession et de la possibilité de renouvellement (CDLD art. L1232-12 §2)."],
  sihl1945:["Demande adressée à la Cellule de gestion du patrimoine funéraire (SPW IAS) en vue de l'enlèvement ou du déplacement d'une sépulture érigée avant 1945.","Référence : AGW du 29/10/2009, art. 44.","Sépulture concernée : ALM/H1 — Caporal Henri DELVAUX (1918)."],
};
function EditDossierModal({rec,onSave,onClose}){
  const [f,setF]=useState({
    denom1:rec.denom1||"",denom2:rec.denom2||"",nature:rec.nature||"",statut:rec.statut||"",
    duree:rec.duree||"",octroi:rec.octroi||"",expiration:rec.expiration||"",derniereInhum:rec.derniereInhum||"",
    conc:rec.personnes?.responsable?.[0]?.nom||"",concNN:rec.personnes?.responsable?.[0]?.nn||"",concAdr:rec.personnes?.responsable?.[0]?.adresse||"",
    placesTot:rec.placesTot??"",placesOcc:rec.placesOcc??"",
    longueur:rec.longueur||"",largeur:rec.largeur||"",profondeur:rec.profondeur||"",typeOuverture:rec.typeOuverture||"",modeOuverture:rec.modeOuverture||"",
    monType:rec.monument?.type||"",monMat:rec.monument?.materiau||"",monEtat:rec.monument?.etat||"",
    etatCode:rec.etat?.codeEtat||"",desaffection:rec.etat?.desaffection||"",observations:rec.observations||"",
  });
  const up=(k,v)=>setF(s=>({...s,[k]:v}));
  return(<div className="fixed inset-0 z-[9998] grid place-items-center bg-black/30 p-4" onClick={onClose}>
    <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl" onClick={e=>e.stopPropagation()}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3"><span className="flex items-center gap-2 text-[13.5px] font-semibold text-slate-800"><SquarePen size={16} className="text-[#CD0947]"/>Modifier le dossier — {rec.ref}</span><button onClick={onClose}><X size={18} className="text-slate-400"/></button></div>
      <div className="p-4">
        <Sub>Informations générales</Sub><Grid3>
          <Field label="Dénomination (1)"><Inp value={f.denom1} onChange={e=>up("denom1",e.target.value)}/></Field>
          <Field label="Dénomination (2)"><Inp value={f.denom2} onChange={e=>up("denom2",e.target.value)}/></Field>
          <Field label="Nature"><Sel value={f.nature} onChange={e=>up("nature",e.target.value)}>{Object.entries(NATURES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</Sel></Field>
          <Field label="Statut"><Sel value={f.statut} onChange={e=>up("statut",e.target.value)}>{Object.entries(STATUTS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</Sel></Field>
          <Field label="Durée"><Inp value={f.duree} onChange={e=>up("duree",e.target.value)}/></Field>
          <Field label="Dernière inhumation"><Inp value={f.derniereInhum} onChange={e=>up("derniereInhum",e.target.value)}/></Field>
          <Field label="Date d'octroi"><Inp value={f.octroi} onChange={e=>up("octroi",e.target.value)}/></Field>
          <Field label="Date d'expiration"><Inp value={f.expiration} onChange={e=>up("expiration",e.target.value)}/></Field>
        </Grid3>
        <Sub>Emplacement & dimensions</Sub><Grid3>
          <Field label="Type d'ouverture"><Inp value={f.typeOuverture} onChange={e=>up("typeOuverture",e.target.value)}/></Field>
          <Field label="Mode d'ouverture"><Inp value={f.modeOuverture} onChange={e=>up("modeOuverture",e.target.value)}/></Field>
          <Field label="Longueur (m)"><Inp value={f.longueur} onChange={e=>up("longueur",e.target.value)}/></Field>
          <Field label="Largeur (m)"><Inp value={f.largeur} onChange={e=>up("largeur",e.target.value)}/></Field>
          <Field label="Profondeur (m)"><Inp value={f.profondeur} onChange={e=>up("profondeur",e.target.value)}/></Field>
          <Field label="Places totales"><Inp value={f.placesTot} onChange={e=>up("placesTot",e.target.value)}/></Field>
          <Field label="Places occupées"><Inp value={f.placesOcc} onChange={e=>up("placesOcc",e.target.value)}/></Field>
        </Grid3>
        <Sub>Concessionnaire / responsable</Sub><Grid3>
          <Field label="Nom & prénom"><Inp value={f.conc} onChange={e=>up("conc",e.target.value)}/></Field>
          <Field label="N° national"><Inp value={f.concNN} onChange={e=>up("concNN",e.target.value)}/></Field>
          <Field label="Adresse" full><Inp value={f.concAdr} onChange={e=>up("concAdr",e.target.value)}/></Field>
        </Grid3>
        <Sub>Monument & état</Sub><Grid3>
          <Field label="Type de monument"><Inp value={f.monType} onChange={e=>up("monType",e.target.value)}/></Field>
          <Field label="Matériau"><Inp value={f.monMat} onChange={e=>up("monMat",e.target.value)}/></Field>
          <Field label="État du monument"><Sel value={f.monEtat} onChange={e=>up("monEtat",e.target.value)}><option>Bon</option><option>Moyen</option><option>À restaurer</option></Sel></Field>
          <Field label="Code état"><Inp value={f.etatCode} onChange={e=>up("etatCode",e.target.value)}/></Field>
          <Field label="Désaffection"><Sel value={f.desaffection} onChange={e=>up("desaffection",e.target.value)}><option>Aucune</option><option>Engagée</option><option>Prononcée</option></Sel></Field>
        </Grid3>
        <Sub>Observations</Sub>
        <Txt value={f.observations} onChange={e=>up("observations",e.target.value)}/>
      </div>
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white px-4 py-3">
        <button onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-[12.5px] text-slate-700 hover:bg-slate-100">Annuler</button>
        <button onClick={()=>onSave(f)} className="rounded-md bg-[#CD0947] px-4 py-2 text-[12.5px] font-medium text-white hover:opacity-90">Enregistrer</button>
      </div>
    </div></div>);
}

/* ---------- REPRISE / IMPORT SAPHIR ---------- */
const SAPHIR_NAT={PT:"pleine_terre",CA:"caveau",CV:"cavurne",CO:"columbarium",DI:"dispersion",OS:"ossuaire",PE:"etoiles",SI:"sihl"};
const SAPHIR_STA={OC:"occupe",AC:"occupe",EC:"echue",EX:"echue",RE:"renouvellement",RN:"renouvellement",RP:"reprise",LI:"libre"};
const SAMPLE_IMPORT=[
  {ref:"ALM/A/12",cimetiere:"Cimetière de Belgrade",numInterne:"9953",denom1:"SERVAIS",denom2:"COUNET",nature:"caveau",statut:"occupe",duree:"50 ans",octroi:"13/08/2010",expiration:"2060",longueur:"2.40",largeur:"1.37",profondeur:"2.32",placesTot:4,placesOcc:1,codeOuverture:"OUV-811",modeOuverture:"Dalle béton",derniereInhum:"15/07/2004",observations:"Entretien à surveiller.",personnes:{concessionnaire:[{nom:"SERVAIS Yvonne",nn:"40935174611",naissance:"12/07/1966",adresse:"rue du Tilleul 12, 1325 Jambes"}]},inhumes:[{nom:"SERVAIS Simonne",naissance:"04/03/1889",deces:"15/07/2004",inhum:"18/07/2004",pf:"PF Lebrun"}]},
  {ref:"ALM/B/03",cimetiere:"Cimetière de Belgrade",numInterne:"9954",denom1:"HENRY",denom2:"",nature:"pleine_terre",statut:"echue",duree:"30 ans",octroi:"02/02/1994",expiration:"2024",longueur:"2.10",largeur:"1.10",profondeur:"1.50",placesTot:2,placesOcc:2,codeOuverture:"OUV-220",modeOuverture:"Pleine terre",derniereInhum:"11/03/2019",personnes:{concessionnaire:[{nom:"HENRY Marcel",nn:"52004112233",naissance:"20/05/1952",adresse:"Chaussée 45, 1325 Bomel"}]},inhumes:[{nom:"HENRY Marcel",naissance:"20/05/1952",deces:"11/03/2019",inhum:"14/03/2019",pf:"PF Gérard"}]},
  {ref:"DIO/C/01",cimetiere:"Cimetière de Bouge",numInterne:"9955",denom1:"DELVAUX",denom2:"",nature:"columbarium",statut:"occupe",duree:"30 ans",octroi:"14/05/2015",expiration:"2045",placesTot:1,placesOcc:1,codeOuverture:"OUV-540",derniereInhum:"20/06/2018",observations:"Columbarium rangée C.",personnes:{concessionnaire:[{nom:"DELVAUX Henri",nn:"48051200112",naissance:"04/03/1889",adresse:"rue Haute 7, 1325 Belgrade"}]},inhumes:[]},
];
function mapSaphirCsvRow(r){
  const ref=r.EMPLACEMENT||r.emplacement||""; if(!ref)return null;
  const exp=(r.DATE_EXPIRATION||"").match(/\d{4}/);
  return {ref,numInterne:r.NO_INTERNE||"",cimetiere:r.CM_CIMETIERE_FK||r.CIMETIERE||"Belgrade",
    denom1:r.NOM1||"",denom2:r.NOM2||"",nature:SAPHIR_NAT[r.NATURE]||"caveau",statut:SAPHIR_STA[r.STATUT]||"occupe",
    duree:r.DUREE?r.DUREE+" ans":"",octroi:r.DATE_OCTROI||"",expiration:exp?exp[0]:"",
    longueur:r.LONGUEUR||"",largeur:r.LARGEUR||"",profondeur:r.PROFONDEUR||"",
    placesTot:+r.NOMBRE_PLACES_TOTALES||0,placesOcc:+r.NOMBRE_PLACES_OCCUPEES||0,
    codeOuverture:r.CODE_OUVERTURE||"",modeOuverture:r.MODE_OUVERTURE||"",derniereInhum:r.DATE_DERNIERE_INHUMATION||"",
    observations:r.OBSERVATIONS||""};
}
function RepriseImport({onImport}){
  const [recs,setRecs]=useState([]);const [src,setSrc]=useState("");const [err,setErr]=useState("");
  const onFile=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;setErr("");
    const rd=new FileReader();
    rd.onload=()=>{try{
      if(f.name.toLowerCase().endsWith(".json")){const j=JSON.parse(rd.result);const list=j.concessions||j;setRecs(Array.isArray(list)?list:[]);setSrc(f.name+" · JSON moulinette");}
      else{const txt=rd.result;const delim=(txt.split("\n")[0].match(/;/g)||[]).length>=(txt.split("\n")[0].match(/,/g)||[]).length?";":",";
        const p=Papa.parse(txt,{header:true,delimiter:delim,skipEmptyLines:true});
        setRecs((p.data||[]).map(mapSaphirCsvRow).filter(Boolean));setSrc(f.name+" · CSV SAPHIR auto-mappé");}
    }catch(x){setErr("Fichier illisible : "+x.message);setRecs([]);}};
    rd.readAsText(f,"utf-8");};
  return(<div className="h-full overflow-auto bg-slate-50 p-6"><div className="mx-auto max-w-4xl">
    <h2 className="text-[15px] font-semibold text-slate-800">Reprise — import depuis SAPHIR</h2>
    <p className="mb-3 text-[12px] text-slate-500">Chargez l'export de reprise (<span className="font-mono">cimsystem_import.json</span> produit par la moulinette) ou directement un <span className="font-mono">CM_CONCESSION.csv</span> (auto‑mappé). Aperçu avant import.</p>
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white p-4">
      <label className="flex cursor-pointer items-center gap-2 rounded-md bg-[#CD0947] px-3.5 py-2 text-[12.5px] font-medium text-white hover:opacity-90"><Upload size={15}/>Choisir un fichier (.json / .csv)<input type="file" accept=".json,.csv" className="hidden" onChange={onFile}/></label>
      <button onClick={()=>{setRecs(SAMPLE_IMPORT);setSrc("Jeu d'exemple SAPHIR (3 concessions)");setErr("");}} className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-[12.5px] text-slate-700 hover:bg-slate-100">Charger l'exemple</button>
      {src&&<span className="text-[11.5px] text-slate-500">Source : {src} · <b>{recs.length}</b> concession(s) détectée(s)</span>}
    </div>
    {err&&<div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-[12px] text-red-700">{err}</div>}
    {recs.length>0&&<>
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-[12px]"><thead><tr className="border-b border-slate-200 text-left text-[10.5px] uppercase tracking-wide text-slate-400">
          {["Réf.","N° interne","Cimetière","Dénomination","Nature","Statut","Places","Octroi","Échéance"].map(h=><th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
          <tbody>{recs.slice(0,200).map((r,i)=>{const nat=NATURES[r.nature];const st=STATUTS[r.statut]||{label:r.statut||"—",ring:"#64748B"};return(<tr key={i} className="border-b border-slate-100">
            <td className="px-3 py-1.5 font-mono font-medium text-slate-800">{r.ref}</td><td className="px-3 py-1.5 font-mono text-slate-500">{r.numInterne}</td>
            <td className="px-3 py-1.5 text-slate-600">{r.cimetiere}</td><td className="px-3 py-1.5 text-slate-700">{r.denom1} {r.denom2}</td>
            <td className="px-3 py-1.5">{nat&&<span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{background:nat.color}}/>{nat.label}</span>}</td>
            <td className="px-3 py-1.5" style={{color:st?.ring}}>{st?.label||r.statut}</td>
            <td className="px-3 py-1.5 font-mono text-slate-500">{r.placesOcc||0}/{r.placesTot||0}</td>
            <td className="px-3 py-1.5 font-mono text-slate-500">{r.octroi}</td><td className="px-3 py-1.5 font-mono text-slate-500">{r.expiration}</td></tr>);})}</tbody></table>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={()=>onImport(recs)} className="flex items-center gap-1.5 rounded-md bg-[#CD0947] px-4 py-2 text-[13px] font-medium text-white hover:opacity-90"><FilePlus size={15}/>Importer {recs.length} concession(s)</button>
        <span className="text-[11px] text-slate-400">Les concessions importées rejoignent le module Concessions (maquette : en mémoire).</span>
      </div>
    </>}
  </div></div>);
}

/* ---------- DÉCLARATION DE DÉCÈS : portail PF + gestion communale ---------- */
const PF_ENTREPRISES=[
  {nom:"Funérailles Altenloh & Greindl",adresse:"Av. Oscar Van Goidtsnoven 6, 1180 Uccle",cp:"1180",contact:"M. Greindl",commune:"Uccle",tel:"02 792 08 08",mail:"jpa@ag-funeral.be"},
  {nom:"Pompes funèbres Lebrun",adresse:"Rue de Wavre 14, 1325 Namur",cp:"1325",contact:"S. Lebrun",commune:"Namur",tel:"010 65 00 00",mail:"info@pf-lebrun.be"},
];
const SEED_DECLS=[
  {id:"17027_20260623_0001",statut:"Acceptée",pf:PF_ENTREPRISES[0],defunt:{nom:"VANDEN BERGHE",prenom:"Marcel",nn:"38.05.12-145.30",dateDeces:"22/06/2026",etatCivil:"Marié",adresseDeces:"Chirec, Uccle"},funerailles:{mode:"Inhumation",rite:"Religieux",cimetiere:"Cimetière d'Ophain",date:"29/06/2026",heure:"14:00",destination:"Vers une autre commune"},agent:{prenom:"Jean",nom:"Altenloh",nn:"61.03.30-433.66"}},
  {id:"17027_20260624_0002",statut:"Envoyée",pf:PF_ENTREPRISES[1],defunt:{nom:"SERVAIS",prenom:"Simonne",nn:"31.09.27-112.40",dateDeces:"23/06/2026",etatCivil:"Veuve",adresseDeces:"rue du Tilleul 12, Jambes"},funerailles:{mode:"Inhumation",rite:"Civil",cimetiere:"Cimetière de Belgrade",date:"27/06/2026",heure:"10:30",destination:"Inhumation d'urne"},agent:{prenom:"Sophie",nom:"Lebrun",nn:"70.01.01-001.12"}},
];
const STATUT_DECL={"Brouillon":"#94A3B8","Envoyée":"#3a5aa0","Acceptée":"#2E971F","Refusée":"#C0392B","Complément demandé":"#E08E33"};
const PF_STEPS=["Conditions","Défunt","Constat","Funérailles","Déclarant","Pouvoir","Demandes","Confirmation"];

function Stepper({step,setStep}){
  return(<div className="flex flex-wrap items-center gap-x-1 gap-y-1 border-b border-slate-200 bg-white px-4 py-2 text-[12px]">
    {PF_STEPS.map((s,i)=>(<button key={s} onClick={()=>setStep(i)} className="flex items-center gap-1.5">
      <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold ${i===step?"bg-[#CD0947] text-white":i<step?"bg-green-500 text-white":"bg-slate-200 text-slate-500"}`}>{i<step?"✓":i+1}</span>
      <span className={i===step?"font-semibold text-slate-800":"text-slate-500"}>{s}</span>
      {i<PF_STEPS.length-1&&<span className="mx-1 text-slate-300">───</span>}</button>))}
  </div>);
}
function AgendaHint({date}){
  const slots=[["08:00–09:00","libre"],["09:00–10:00","libre"],["10:00–11:00","réservé"],["11:00–12:00","libre"],["12:30–13:30","réservé"],["14:00–15:00","libre"]];
  return(<div className="rounded-lg border border-slate-200 bg-white p-3">
    <div className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-slate-700"><span>Disponibilités fossoyeurs</span><span className="text-[11px] font-normal text-slate-400">{date||"—"}</span></div>
    <div className="space-y-1">{slots.map(([h,st])=>(<div key={h} className={`flex items-center justify-between rounded px-2 py-1 text-[11.5px] ${st==="libre"?"bg-green-50 text-green-700":"bg-red-50 text-red-500 line-through"}`}><span>{h}</span><span>{st==="libre"?"disponible":"indisponible"}</span></div>))}</div>
    <p className="mt-2 text-[10.5px] text-slate-400">Le créneau choisi est réservé auprès des fossoyeurs (agenda partagé commune).</p>
  </div>);
}
function PFWizard({onSend}){
  const [step,setStep]=useState(0);
  const [f,setF]=useState({accept:false,nom:"",prenom:"",nn:"",etatCivil:"Marié",domicilie:true,lieuNaiss:"",dateNaiss:"",dateDeces:"",heureD:"",adresseDeces:"",mortViolente:false,
    medecin:"",dateConstat:"",heureConstat:"",obstacle:"Non",donCorps:"Non",
    mode:"Inhumation",rite:"Civil",miseBiere:"",destination:"Inhumation",cimetiere:"Cimetière de Belgrade",dateFun:"",heureFun:"",commentaire:"",
    agentPrenom:"",agentNom:"",agentNN:"",
    mandant:"",qualite:"",telMandant:"",
    justifs:"0",certificats:"1",visites:"",intimite:false,strict:false,redevance:"Oui",concession:"À facturer"});
  const up=(k,v)=>setF(s=>({...s,[k]:v}));
  const next=()=>setStep(s=>Math.min(PF_STEPS.length-1,s+1));
  const prev=()=>setStep(s=>Math.max(0,s-1));
  const send=()=>{const d={id:"DEMANDE_"+Date.now(),statut:"Envoyée",pf:PF_ENTREPRISES[1],
    defunt:{nom:f.nom||"—",prenom:f.prenom,nn:f.nn,dateDeces:f.dateDeces,etatCivil:f.etatCivil,adresseDeces:f.adresseDeces},
    funerailles:{mode:f.mode,rite:f.rite,cimetiere:f.cimetiere,date:f.dateFun,heure:f.heureFun,destination:f.destination},
    agent:{prenom:f.agentPrenom,nom:f.agentNom,nn:f.agentNN}};onSend(d);};
  return(<div className="flex h-full flex-col bg-slate-50">
    <Stepper step={step} setStep={setStep}/>
    <div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="mx-auto max-w-4xl">
      {step===0&&<div className="rounded-xl border border-slate-200 bg-white p-5 text-[12.5px] leading-relaxed text-slate-600">
        <p className="mb-2 font-semibold text-slate-800">Conditions générales d'utilisation</p>
        <p>Ce programme d'encodage des funérailles a pour objectif de récolter les informations et documents nécessaires à l'établissement d'un acte de décès par le service Citoyenneté de la commune. Le déclarant s'engage à réserver les funérailles via le calendrier mis à disposition, à ne pas introduire de déclarations fictives, et reconnaît avoir pris connaissance du règlement sur les cimetières communaux.</p>
        <p className="mt-2">Aucune autorisation d'inhumer, de disperser ou de crémation ne sera délivrée tant que le service Citoyenneté n'a pas validé définitivement la demande.</p>
        <label className="mt-3 flex items-center gap-2 text-slate-700"><input type="checkbox" checked={f.accept} onChange={e=>up("accept",e.target.checked)}/>Accepter les conditions générales d'utilisation</label>
      </div>}
      {step===1&&<><Sub>Défunt</Sub><Grid3>
        <Field label="Nom du défunt *"><Inp value={f.nom} onChange={e=>up("nom",e.target.value)}/></Field>
        <Field label="Prénom du défunt *"><Inp value={f.prenom} onChange={e=>up("prenom",e.target.value)}/></Field>
        <Field label="Numéro national"><Inp value={f.nn} onChange={e=>up("nn",e.target.value)}/></Field>
        <Field label="État-civil"><Sel value={f.etatCivil} onChange={e=>up("etatCivil",e.target.value)}><option>Célibataire</option><option>Marié</option><option>Veuf/Veuve</option><option>Divorcé(e)</option><option>Cohabitant légal</option></Sel></Field>
        <Field label="Lieu de naissance"><Inp value={f.lieuNaiss} onChange={e=>up("lieuNaiss",e.target.value)}/></Field>
        <Field label="Date de naissance *"><Inp type="date" value={f.dateNaiss} onChange={e=>up("dateNaiss",e.target.value)}/></Field>
        <Field label="Date du décès *"><Inp type="date" value={f.dateDeces} onChange={e=>up("dateDeces",e.target.value)}/></Field>
        <Field label="Heure du décès *"><Inp type="time" value={f.heureD} onChange={e=>up("heureD",e.target.value)}/></Field>
        <Field label="Adresse du décès *" full><Inp value={f.adresseDeces} onChange={e=>up("adresseDeces",e.target.value)}/></Field>
      </Grid3>
      <div className="mt-2 flex gap-6 text-[12px] text-slate-600"><label className="flex items-center gap-2"><input type="checkbox" checked={f.domicilie} onChange={e=>up("domicilie",e.target.checked)}/>Domicilié dans la commune</label><label className="flex items-center gap-2"><input type="checkbox" checked={f.mortViolente} onChange={e=>up("mortViolente",e.target.checked)}/>Mort violente</label></div></>}
      {step===2&&<><Sub>Constat de décès</Sub><Grid3>
        <Field label="Médecin constatant"><Inp value={f.medecin} onChange={e=>up("medecin",e.target.value)}/></Field>
        <Field label="Date du constat"><Inp type="date" value={f.dateConstat} onChange={e=>up("dateConstat",e.target.value)}/></Field>
        <Field label="Heure du constat"><Inp type="time" value={f.heureConstat} onChange={e=>up("heureConstat",e.target.value)}/></Field>
        <Field label="Obstacle médico-légal"><Sel value={f.obstacle} onChange={e=>up("obstacle",e.target.value)}><option>Non</option><option>Oui</option></Sel></Field>
        <Field label="Don du corps à la science"><Sel value={f.donCorps} onChange={e=>up("donCorps",e.target.value)}><option>Non</option><option>Oui</option></Sel></Field>
      </Grid3><Upload2 label="Modèle IIIC / IIID (certificat de décès)"/></>}
      {step===3&&<div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]"><div><Sub>Funérailles</Sub><Grid3>
        <Field label="Inhumation – crémation"><Sel value={f.mode} onChange={e=>up("mode",e.target.value)}><option>Inhumation</option><option>Crémation</option></Sel></Field>
        <Field label="Civil – religieux"><Sel value={f.rite} onChange={e=>up("rite",e.target.value)}><option>Civil</option><option>Religieux</option></Sel></Field>
        <Field label="Date de mise en bière"><Inp type="date" value={f.miseBiere} onChange={e=>up("miseBiere",e.target.value)}/></Field>
        <Field label="Destination du corps / des cendres"><Sel value={f.destination} onChange={e=>up("destination",e.target.value)}><option>Inhumation</option><option>Inhumation d'urne</option><option>Dispersion</option><option>Vers une autre commune</option><option>Conservation</option></Sel></Field>
        <Field label="Cimetière"><Sel value={f.cimetiere} onChange={e=>up("cimetiere",e.target.value)}>{CEMETERIES.map(c=><option key={c.id}>{c.nom}</option>)}</Sel></Field>
        <Field label="Date des funérailles"><Inp type="date" value={f.dateFun} onChange={e=>up("dateFun",e.target.value)}/></Field>
        <Field label="Heure d'inhumation"><Inp type="time" value={f.heureFun} onChange={e=>up("heureFun",e.target.value)}/></Field>
      </Grid3><div className="mt-2"><Field label="Commentaire" full><Txt value={f.commentaire} onChange={e=>up("commentaire",e.target.value)}/></Field></div></div>
      <div className="pt-6"><AgendaHint date={f.dateFun}/></div></div>}
      {step===4&&<><Sub>Déclarant (pompes funèbres)</Sub><Grid3>
        <Field label="Prénom de l'agent"><Inp value={f.agentPrenom} onChange={e=>up("agentPrenom",e.target.value)}/></Field>
        <Field label="Nom de l'agent"><Inp value={f.agentNom} onChange={e=>up("agentNom",e.target.value)}/></Field>
        <Field label="N° national de l'agent"><Inp value={f.agentNN} onChange={e=>up("agentNN",e.target.value)}/></Field>
      </Grid3></>}
      {step===5&&<><Sub>Pouvoir / mandat</Sub><Grid3>
        <Field label="Nom du mandant"><Inp value={f.mandant} onChange={e=>up("mandant",e.target.value)}/></Field>
        <Field label="Qualité / lien"><Inp value={f.qualite} onChange={e=>up("qualite",e.target.value)}/></Field>
        <Field label="Téléphone"><Inp value={f.telMandant} onChange={e=>up("telMandant",e.target.value)}/></Field>
      </Grid3><Upload2 label="Mandat signé"/></>}
      {step===6&&<div className="grid gap-5 md:grid-cols-2"><div><Sub>Demandes</Sub>
        <div className="space-y-3"><Field label="Nombre de justificatifs d'absence"><Inp value={f.justifs} onChange={e=>up("justifs",e.target.value)}/></Field>
        <Field label="Nombre de certificats de décès"><Inp value={f.certificats} onChange={e=>up("certificats",e.target.value)}/></Field>
        <Field label="Visites"><Inp value={f.visites} onChange={e=>up("visites",e.target.value)}/></Field></div>
        <div className="mt-2 flex gap-6 text-[12px] text-slate-600"><label className="flex items-center gap-2"><input type="checkbox" checked={f.intimite} onChange={e=>up("intimite",e.target.checked)}/>Intimité</label><label className="flex items-center gap-2"><input type="checkbox" checked={f.strict} onChange={e=>up("strict",e.target.checked)}/>Stricte intimité</label></div></div>
        <div><Sub>Documents & redevances</Sub><div className="space-y-3">
          <Upload2 label="Document IIIC"/><Upload2 label="Mandat"/><Upload2 label="Carte d'identité"/><Upload2 label="Dernières volontés (annexes)"/>
          <Field label="Je paye la redevance communale"><Sel value={f.redevance} onChange={e=>up("redevance",e.target.value)}><option>Oui</option><option>Non</option></Sel></Field>
          <Field label="Paiement de la concession"><Sel value={f.concession} onChange={e=>up("concession",e.target.value)}><option>À facturer</option><option>Payé</option><option>Sans objet</option></Sel></Field>
        </div></div></div>}
      {step===7&&<div className="rounded-xl border border-slate-200 bg-white p-5">
        <Sub>Confirmation d'envoi</Sub>
        <p className="text-[12.5px] text-slate-600">Récapitulatif : <b>{f.prenom} {f.nom}</b> — décès le {f.dateDeces||"—"} · {f.mode} ({f.rite}) au {f.cimetiere} le {f.dateFun||"—"} à {f.heureFun||"—"}.</p>
        <p className="mt-2 text-[11.5px] text-slate-400">À l'envoi, la demande part au service Citoyenneté de la commune pour validation. Le créneau funéraire est pré‑réservé sur l'agenda des fossoyeurs.</p>
      </div>}
    </div></div>
    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-2.5">
      <button onClick={prev} disabled={step===0} className="rounded-md px-3 py-1.5 text-[12.5px] text-slate-600 hover:bg-slate-100 disabled:opacity-40">Précédent</button>
      <div className="flex gap-2">
        <button onClick={()=>toast("Brouillon enregistré")} className="rounded-md border border-slate-300 px-3.5 py-1.5 text-[12.5px] text-slate-700 hover:bg-slate-100">Enregistrer brouillon</button>
        {step<PF_STEPS.length-1?<button onClick={next} className="rounded-md bg-[#CD0947] px-4 py-1.5 text-[12.5px] font-medium text-white hover:opacity-90">Suivant</button>
          :<button onClick={send} className="rounded-md bg-[#CD0947] px-4 py-1.5 text-[12.5px] font-medium text-white hover:opacity-90">Envoyer à la commune</button>}
      </div>
    </div>
  </div>);
}
function ReviewDeclaration({d,onBack,onStatut,onAddEvent,events=[],onAddInvoice,onAddMessage}){
  const KVl=({k,v})=>(<div className="flex justify-between border-b border-slate-50 py-1 text-[12px]"><span className="text-slate-500">{k}</span><span className="font-medium text-slate-800">{v||"—"}</span></div>);
  const [planned,setPlanned]=useState(false);
  const [invoiced,setInvoiced]=useState(false);
  const [msg,setMsg]=useState("");
  const [conflict,setConflict]=useState(null);
  const toYMD=s=>{if(!s)return "2026-06-29";if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;const m=(""+s).match(/(\d{2})\/(\d{2})\/(\d{4})/);return m?`${m[3]}-${m[2]}-${m[1]}`:s;};
  const shortCim=c=>(""+(c||"")).replace(/^Cimeti[èe]re\s+(de\s+|d'|du\s+|des\s+)?/i,"").trim();
  const evFor=()=>{const fu=d.funerailles;return {id:Date.now(),date:toYMD(fu.date),start:fu.heure||"10:00",dur:60,type:fu.mode==="Crémation"?"cremation":"inhumation",cim:shortCim(fu.cimetiere)||"Namur",eq:"Équipe Nord",ref:d.defunt.nom,who:`${d.pf.nom} — ${d.defunt.nom}`,buf:30};};
  const plan=()=>{if(planned)return;const ev=evFor();
    const cf=events.find(e=>evOverlap(e,ev));setConflict(cf||null);
    onAddEvent&&onAddEvent(ev);setPlanned(true);
    toast(cf?"⚠ Funérailles inscrites — conflit de créneau détecté":"Funérailles inscrites à l'agenda des fossoyeurs");};
  const accept=()=>{onStatut(d.id,"Acceptée");plan();};
  // facturation chiffrée depuis la grille
  const lignes=()=>{const crem=d.funerailles.mode==="Crémation",disp=/[Dd]ispersion/.test(d.funerailles.destination||"");
    const L=[];
    if(crem)L.push(["Taxe de crémation",100]);else L.push(["Taxe d'inhumation",100]);
    if(disp)L.push(["Dispersion des cendres (forfait)",60]);
    if(/caveau/i.test(d.funerailles.destination||"")||/Inhumation/.test(d.funerailles.mode))L.push(["Ouverture / fermeture",75]);
    L.push(["Certificat de décès (1)",5]);
    return L;};
  const total=lignes().reduce((a,l)=>a+l[1],0);
  const facture=()=>{const L=lignes();
    genPdf("Facture — redevances funéraires","Règlement‑redevance communal — Décret du 06/03/2009",
      [`Concerne : funérailles de ${d.defunt.prenom} ${d.defunt.nom} (décès le ${d.defunt.dateDeces||"—"}).`,`Débiteur : ${d.pf.nom} — ${d.pf.mail}.`,"",
       ...L.map(l=>`• ${l[0]} : ${l[1].toLocaleString("fr-BE")} €`),"",`TOTAL : ${total.toLocaleString("fr-BE")} €`,
       "Montants établis d'après la grille tarifaire communale (module Configuration › Tarifs)."],"facture_redevances.pdf");
    if(!invoiced){onAddInvoice&&onAddInvoice({ref:"DC/"+(""+d.id).slice(-4),type:`Funérailles ${d.defunt.prenom} ${d.defunt.nom}`,debiteur:d.pf.nom,montant:total.toLocaleString("fr-BE")+" €",statut:"À échoir",c:"#E08E33"});setInvoiced(true);}
    toast("Facture "+total.toLocaleString("fr-BE")+" € créée et transmise à la facturation");};
  const acte=()=>genPdf("Acte de décès","Code civil (art. 78 à 87) — Décret du 06/03/2009",
    [`L'an 2026, est décédé(e) à ${d.defunt.adresseDeces||"—"}, le ${d.defunt.dateDeces||"—"} :`,`${d.defunt.prenom} ${d.defunt.nom}, ${d.defunt.etatCivil||""}.`,`Numéro national : ${d.defunt.nn||"—"}.`,`Dressé par l'Officier de l'état civil de la Ville de Namur sur déclaration de ${d.pf.nom}.`],"acte_deces.pdf");
  const aut=()=>{const crem=d.funerailles.mode==="Crémation";
    genPdf(crem?"Autorisation de crémation":"Autorisation d'inhumer",crem?"AR du 19/01/1973 — art. 20":"Décret du 06/03/2009 — funérailles et sépultures",
    [`Le Collège communal autorise ${crem?"la crémation":"l'inhumation"} de la dépouille mortelle de :`,`${d.defunt.prenom} ${d.defunt.nom} — décédé(e) le ${d.defunt.dateDeces||"—"}.`,`Lieu : ${d.funerailles.cimetiere} — le ${d.funerailles.date||"—"} à ${d.funerailles.heure||"—"}.`,`Destination : ${d.funerailles.destination||"—"}.`,`Délivrée sous réserve du respect du règlement communal des cimetières.`],crem?"autorisation_cremation.pdf":"autorisation_inhumer.pdf");};
  const transport=()=>genPdf("Autorisation de transport de corps","Décret du 06/03/2009",
    [`Autorisation de transport de la dépouille de ${d.defunt.prenom} ${d.defunt.nom}.`,`Destination : ${d.funerailles.destination||"—"} — ${d.funerailles.cimetiere}.`,`Transport assuré par ${d.pf.nom}.`],"autorisation_transport.pdf");
  const send=(sender)=>{if(!msg.trim())return;onAddMessage&&onAddMessage(d.id,{sender,texte:msg.trim(),date:"25/06/2026 "+new Date().toLocaleTimeString("fr-BE",{hour:"2-digit",minute:"2-digit"})});setMsg("");};
  const askComplement=()=>{onAddMessage&&onAddMessage(d.id,{sender:"Commune",texte:msg.trim()||"Merci de compléter le dossier : document manquant (modèle IIIC / mandat signé / pièce d'identité).",date:"25/06/2026"});setMsg("");onStatut(d.id,"Complément demandé");};
  const accepted=d.statut==="Acceptée";const thread=d.messages||[];
  return(<div className="flex h-full bg-slate-50">
    <aside className="w-72 shrink-0 overflow-auto border-r border-slate-200 bg-white p-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Entreprise de pompes funèbres</div>
      <div className="text-[13px] font-semibold text-slate-800">{d.pf.nom}</div>
      <div className="mt-2 space-y-1 text-[12px] text-slate-600">
        <div>{d.pf.adresse}</div><div>{d.pf.cp} · {d.pf.commune}</div><div>Contact : {d.pf.contact}</div><div>☎ {d.pf.tel}</div><div>✉ {d.pf.mail}</div></div>
    </aside>
    <div className="min-h-0 flex-1 overflow-auto p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2"><button onClick={onBack} className="text-[12px] text-slate-500 hover:text-slate-800">‹ Liste</button>
          <h2 className="text-[14px] font-semibold text-slate-800">Demande N° {d.id}</h2>
          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{background:STATUT_DECL[d.statut]}}>{d.statut}</span></div>
        <div className="flex gap-2">
          <button onClick={askComplement} className="rounded-md bg-[#E08E33] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90">Demande complément</button>
          <button onClick={()=>onStatut(d.id,"Refusée")} className="rounded-md bg-[#C0392B] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90">Refuser</button>
          <button onClick={accept} className="rounded-md bg-[#2E971F] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90">Accepter</button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="mb-1 text-[12px] font-semibold text-slate-700">Défunt</div>
          <KVl k="Nom" v={d.defunt.nom}/><KVl k="Prénom" v={d.defunt.prenom}/><KVl k="N° national" v={d.defunt.nn}/><KVl k="État-civil" v={d.defunt.etatCivil}/><KVl k="Date du décès" v={d.defunt.dateDeces}/><KVl k="Adresse du décès" v={d.defunt.adresseDeces}/></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="mb-1 text-[12px] font-semibold text-slate-700">Funérailles</div>
          <KVl k="Mode" v={d.funerailles.mode}/><KVl k="Rite" v={d.funerailles.rite}/><KVl k="Cimetière" v={d.funerailles.cimetiere}/><KVl k="Date" v={d.funerailles.date}/><KVl k="Heure" v={d.funerailles.heure}/><KVl k="Destination" v={d.funerailles.destination}/></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="mb-1 text-[12px] font-semibold text-slate-700">Déclarant (PF)</div>
          <KVl k="Agent" v={`${d.agent.prenom} ${d.agent.nom}`}/><KVl k="N° national" v={d.agent.nn}/></div>
        <div className={`rounded-xl border p-4 ${accepted?"border-emerald-200 bg-emerald-50/50":"border-slate-200 bg-white"}`}>
          <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-slate-700"><ShieldCheck size={15} className={accepted?"text-emerald-600":"text-slate-400"}/>Suite communale</div>
          {!accepted?<p className="text-[11.5px] text-slate-500">Après acceptation : génération de l'acte de décès et des autorisations, planification confirmée sur l'agenda funérailles, et facturation des redevances.</p>
          :<div className="space-y-2">
            <p className="text-[11.5px] text-emerald-700">Demande validée — actes et autorisations disponibles{planned?", funérailles inscrites à l'agenda":""}.</p>
            {conflict&&<div className="rounded-md bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700">⚠ Conflit de créneau au {conflict.cim} le {conflict.date} ({conflict.start}) — ajustez l'horaire dans l'agenda.</div>}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={acte} className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11.5px] text-slate-700 hover:bg-slate-100"><FileText size={13}/>Acte de décès</button>
              <button onClick={aut} className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11.5px] text-slate-700 hover:bg-slate-100"><FileCheck2 size={13}/>{d.funerailles.mode==="Crémation"?"Autorisation crémation":"Autorisation d'inhumer"}</button>
              <button onClick={transport} className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11.5px] text-slate-700 hover:bg-slate-100"><FileText size={13}/>Autorisation transport</button>
              <button onClick={facture} className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11.5px] text-slate-700 hover:bg-slate-100"><Receipt size={13}/>Facture {total.toLocaleString("fr-BE")} €{invoiced&&" ✓"}</button>
            </div>
            <button onClick={plan} disabled={planned} className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#CD0947] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-50"><CalendarDays size={14}/>{planned?"Inscrit à l'agenda ✓":"Inscrire aux funérailles (agenda)"}</button>
          </div>}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-slate-700"><Mail size={15} className="text-[#CD0947]"/>Échanges avec les pompes funèbres</div>
        <div className="mb-3 space-y-2">
          {thread.length===0&&<p className="text-[11.5px] italic text-slate-400">Aucun échange. Utilisez « Demande complément » ou le champ ci‑dessous pour écrire à l'entreprise.</p>}
          {thread.map((m,i)=>(<div key={i} className={`flex ${m.sender==="Commune"?"justify-end":"justify-start"}`}>
            <div className={`max-w-[75%] rounded-lg px-3 py-1.5 text-[12px] ${m.sender==="Commune"?"bg-[#CD0947]/10 text-slate-800":"bg-slate-100 text-slate-700"}`}>
              <div className="mb-0.5 text-[10px] font-medium text-slate-400">{m.sender} · {m.date}</div>{m.texte}</div>
          </div>))}
        </div>
        <div className="flex items-center gap-2">
          <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send("Commune")} placeholder="Message au déclarant (commune)…" className="flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-[12px] outline-none focus:border-[#CD0947]/50"/>
          <button onClick={()=>send("Commune")} className="rounded-md bg-[#CD0947] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90">Envoyer</button>
          <button onClick={()=>send("PF")} className="rounded-md border border-slate-300 px-3 py-1.5 text-[12px] text-slate-600 hover:bg-slate-100" title="Simuler une réponse de l'entreprise">Réponse PF (démo)</button>
        </div>
      </div>
    </div>
  </div>);
}
function DecesModule({onAddEvent,events=[],onAddInvoice}){
  const [tab,setTab]=useState("gestion");
  const [decls,setDecls]=useState(SEED_DECLS);
  const [openId,setOpenId]=useState(null);
  const setStatut=(id,st)=>{setDecls(ds=>ds.map(d=>d.id===id?{...d,statut:st}:d));toast("Déclaration "+st.toLowerCase());if(st!=="Acceptée")setOpenId(null);};
  const addMsg=(id,msg)=>setDecls(ds=>ds.map(d=>d.id===id?{...d,messages:[...(d.messages||[]),msg]}:d));
  const open=decls.find(d=>d.id===openId);
  return(<div className="flex h-full flex-col">
    <div className="flex gap-1 border-b border-slate-200 bg-white px-4 pt-2 text-[12.5px]">
      <button onClick={()=>{setTab("gestion");setOpenId(null);}} className={`rounded-t-md px-3 py-2 ${tab==="gestion"?"border-b-2 border-[#CD0947] font-semibold text-slate-900":"text-slate-500 hover:text-slate-700"}`}>Déclarations reçues (commune)</button>
      <button onClick={()=>setTab("wizard")} className={`rounded-t-md px-3 py-2 ${tab==="wizard"?"border-b-2 border-[#CD0947] font-semibold text-slate-900":"text-slate-500 hover:text-slate-700"}`}>+ Nouvelle déclaration (PF)</button>
    </div>
    <div className="min-h-0 flex-1">
      {tab==="wizard"&&<PFWizard onSend={d=>{setDecls(ds=>[d,...ds]);setTab("gestion");toast("Déclaration envoyée à la commune");envoyerDeclaration({defuntNom:((d.defunt&&(d.defunt.nom+" "+(d.defunt.prenom||"")))||"").trim(),defuntDeces:d.defunt&&d.defunt.dateDeces,operateurPF:typeof d.pf==="string"?d.pf:((d.pf&&d.pf.nom)||""),typeCeremonie:d.funerailles&&d.funerailles.mode,cimetiere:d.funerailles&&d.funerailles.cimetiere,dateSouhaitee:d.funerailles&&d.funerailles.date,statut:"recue"});}}/>}
      {tab==="gestion"&&(open?<ReviewDeclaration d={open} onBack={()=>setOpenId(null)} onStatut={setStatut} onAddEvent={onAddEvent} events={events} onAddInvoice={onAddInvoice} onAddMessage={addMsg}/>:
        <div className="h-full overflow-auto bg-slate-50 p-5">
          <h2 className="text-[15px] font-semibold text-slate-800">Déclarations de décès reçues</h2>
          <p className="mb-3 text-[11.5px] text-slate-500">Demandes transmises par les pompes funèbres — à valider par le service Citoyenneté.</p>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-[12px]"><thead><tr className="border-b border-slate-200 text-left text-[10.5px] uppercase tracking-wide text-slate-400">
            {["N° demande","Défunt","Pompes funèbres","Funérailles","Cimetière","Statut",""].map(h=><th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
            <tbody>{decls.map(d=>(<tr key={d.id} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50" onClick={()=>setOpenId(d.id)}>
              <td className="px-3 py-2 font-mono text-[11px] text-slate-600">{d.id}</td>
              <td className="px-3 py-2 font-medium text-slate-800">{d.defunt.prenom} {d.defunt.nom}</td>
              <td className="px-3 py-2 text-slate-600">{d.pf.nom}</td>
              <td className="px-3 py-2 font-mono text-slate-500">{d.funerailles.date} {d.funerailles.heure}</td>
              <td className="px-3 py-2 text-slate-600">{d.funerailles.cimetiere}</td>
              <td className="px-3 py-2"><span className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{background:STATUT_DECL[d.statut]}}>{d.statut}</span></td>
              <td className="px-3 py-2 text-right text-slate-400">›</td></tr>))}</tbody></table>
          </div>
        </div>)}
    </div>
  </div>);
}

/* ---------- MESURE & IMPRESSION ---------- */
function polyArea(pts){const R=6378137;const n=pts.length;if(n<3)return 0;let a=0;for(let i=0;i<n;i++){const p1=pts[i],p2=pts[(i+1)%n];a+=(p2.lng-p1.lng)*Math.PI/180*(2+Math.sin(p1.lat*Math.PI/180)+Math.sin(p2.lat*Math.PI/180));}return Math.abs(a*R*R/2);}
function PrintMapModal({plots,colorOf,cem,onClose}){
  const [f,setF]=useState({titre:"Plan du cimetière",desc:"",auteur:"Commune de Namur",format:"a3",orient:"landscape",legend:true});
  const up=(k,v)=>setF(s=>({...s,[k]:v}));
  const gen=()=>{
    const W=560,H=520;let body="";
    plots.forEach(p=>{const fill=p.statut==="libre"?"#F4F7F3":(colorOf?colorOf(p):"#cbd5e1");
      body+=`<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="3" fill="${fill}" stroke="#334155" stroke-width="0.5"/>`;
      if(p.special)body+=`<text x="${p.x+p.w/2}" y="${p.y+p.h/2+3}" font-size="7" text-anchor="middle" fill="#ffffff" font-family="monospace">${p.ref}</text>`;});
    const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'><rect width='${W}' height='${H}' fill='#EDF1EC'/>${body}</svg>`;
    const img=new Image();
    img.onload=()=>{try{
      const sc=3;const cv=document.createElement("canvas");cv.width=W*sc;cv.height=H*sc;const ctx=cv.getContext("2d");
      ctx.fillStyle="#fff";ctx.fillRect(0,0,cv.width,cv.height);ctx.drawImage(img,0,0,cv.width,cv.height);
      const png=cv.toDataURL("image/png");
      const pdf=new jsPDF({unit:"pt",format:f.format,orientation:f.orient});
      const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight();
      pdf.setFont("helvetica","bold");pdf.setFontSize(14);pdf.text(f.titre||"Plan",40,46);
      pdf.setFont("helvetica","normal");pdf.setFontSize(9);pdf.setTextColor(110);
      pdf.text(`${f.auteur}  ·  ${cem?.nom||""}  ·  ${new Date().toLocaleDateString("fr-BE")}`,40,62);
      let top=80;if(f.desc){const dl=pdf.splitTextToSize(f.desc,pw-80);pdf.text(dl,40,76);top=76+dl.length*12+8;}
      pdf.setTextColor(40);
      const availW=pw-80,availH=ph-top-(f.legend?72:34),ar=W/H;let iw=availW,ih=iw/ar;if(ih>availH){ih=availH;iw=ih*ar;}
      pdf.addImage(png,"PNG",40,top,iw,ih);pdf.setDrawColor(180);pdf.rect(40,top,iw,ih);
      pdf.setFontSize(8);pdf.setTextColor(120);pdf.text(`Format ${f.format.toUpperCase()} ${f.orient==="landscape"?"paysage":"portrait"} · projection Lambert 72 · échelle indicative`,40,top+ih+14);
      if(f.legend){let lx=40,ly=top+ih+34;pdf.setTextColor(40);pdf.setFontSize(9);pdf.text("Légende :",lx,ly);ly+=12;
        [["#334155","Octroyée"],["#C0392B","Échue"],["#E08E33","Renouvellement"],["#7A271A","Reprise"],["#6D28D9","Archivée"],["#F4F7F3","Libre"]].forEach((it,i)=>{const x=lx+(i%3)*160,yy=ly+Math.floor(i/3)*15;pdf.setFillColor(it[0]);pdf.setDrawColor(150);pdf.rect(x,yy-8,10,10,"FD");pdf.setTextColor(60);pdf.text(it[1],x+15,yy);});}
      pdf.save(`plan_${(cem?.nom||"cimetiere").replace(/\s+/g,"_")}_${f.format}.pdf`);
      toast("Plan exporté en "+f.format.toUpperCase());onClose();
    }catch(e){toast("Erreur d'impression");}};
    img.onerror=()=>toast("Erreur de rendu du plan");
    img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
  };
  return(<div className="fixed inset-0 z-[9998] grid place-items-center bg-black/30 p-4" onClick={onClose}>
    <div className="w-full max-w-md rounded-xl bg-white shadow-xl" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><span className="flex items-center gap-2 text-[13.5px] font-semibold text-slate-800"><Printer size={16} className="text-[#CD0947]"/>Imprimer le plan</span><button onClick={onClose}><X size={18} className="text-slate-400"/></button></div>
      <div className="space-y-3 p-4">
        <Field label="Titre"><Inp value={f.titre} onChange={e=>up("titre",e.target.value)}/></Field>
        <Field label="Description (facultatif)"><Inp value={f.desc} onChange={e=>up("desc",e.target.value)}/></Field>
        <Field label="Auteur / organisme"><Inp value={f.auteur} onChange={e=>up("auteur",e.target.value)}/></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Format"><Sel value={f.format} onChange={e=>up("format",e.target.value)}><option value="a4">A4</option><option value="a3">A3</option></Sel></Field>
          <Field label="Orientation"><Sel value={f.orient} onChange={e=>up("orient",e.target.value)}><option value="landscape">Paysage</option><option value="portrait">Portrait</option></Sel></Field>
        </div>
        <label className="flex items-center gap-2 text-[12px] text-slate-600"><input type="checkbox" checked={f.legend} onChange={e=>up("legend",e.target.checked)}/>Inclure la légende</label>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">
        <button onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-[12.5px] text-slate-700 hover:bg-slate-100">Annuler</button>
        <button onClick={gen} className="flex items-center gap-1.5 rounded-md bg-[#CD0947] px-4 py-2 text-[12.5px] font-medium text-white hover:opacity-90"><Download size={14}/>Générer le PDF</button>
      </div>
    </div></div>);
}

/* ---------- CONNEXION (avec 2FA) ---------- */
function Login({commune,onLogin}){
  const [step,setStep]=useState(1);
  const [u,setU]=useState("");const [p,setP]=useState("");const [code,setCode]=useState("");const [err,setErr]=useState("");
  const [mfaReq,setMfaReq]=useState(false);
  const [busy,setBusy]=useState(false);
  const submit=async()=>{if(!u.trim()||!p){setErr("Identifiant et mot de passe requis.");return;}setErr("");setBusy(true);
    const r=await connexion(u.trim(),p);setBusy(false);
    if(!r){setErr("Identifiants invalides.");return;}
    if(r.mfaRequired){setMfaReq(true);setStep(2);}else{onLogin(u.trim());}};
  const verify=async()=>{if(code.replace(/\D/g,"").length<6){setErr("Entrez le code à 6 chiffres.");return;}setBusy(true);
    const r=await verifierMfa(code);setBusy(false);
    if(!r){setErr("Code invalide.");return;}
    onLogin(u.trim());};
  return(<div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#CD0947] via-[#a50b39] to-[#6d0a29] p-4" style={{fontFamily:"Inter,ui-sans-serif,system-ui,sans-serif"}}>
    <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
      <div className="mb-5 flex flex-col items-center">
        <D2D3Logo className="h-9 w-auto"/>
        <div className="mt-2 text-[15px] font-bold tracking-wide text-slate-800">CIMSYSTEM<span className="font-light text-[#CD0947]"> V2</span></div>
        <div className="text-[11px] text-slate-400">Gestion des cimetières · {commune}</div>
      </div>
      {step===1?<div className="space-y-3">
        <Field label="Adresse e-mail"><Inp value={u} onChange={e=>setU(e.target.value)} placeholder="adresse e-mail (compte gestionnaire)"/></Field>
        <Field label="Mot de passe"><Inp type="password" value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="••••••••"/></Field>
        {err&&<div className="rounded-md bg-red-50 px-2.5 py-1.5 text-[11.5px] text-red-700">{err}</div>}
        <button onClick={submit} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#CD0947] py-2.5 text-[13px] font-medium text-white hover:opacity-90"><LogIn size={15}/>Se connecter</button>
        <p className="text-center text-[10.5px] text-slate-400">Connectez-vous avec le compte gestionnaire (ADMIN_EMAIL / ADMIN_PASSWORD).</p>
      </div>:<div className="space-y-3">
        <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-[11.5px] text-slate-600"><ShieldCheck size={16} className="text-[#CD0947]"/>Authentification à deux facteurs — un code a été envoyé par e-mail / SMS.</div>
        <Field label="Code de vérification (6 chiffres)"><Inp value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&verify()} placeholder="••••••" className="text-center tracking-[0.4em]"/></Field>
        {err&&<div className="rounded-md bg-red-50 px-2.5 py-1.5 text-[11.5px] text-red-700">{err}</div>}
        <button onClick={verify} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#CD0947] py-2.5 text-[13px] font-medium text-white hover:opacity-90"><KeyRound size={15}/>Vérifier & entrer</button>
        <button onClick={()=>{setStep(1);setErr("");}} className="w-full text-center text-[11.5px] text-slate-500 hover:text-slate-800">‹ Retour</button>
        <p className="text-center text-[10.5px] text-slate-400">Code de votre application d’authentification (si 2FA activée).</p>
      </div>}
      <div className="mt-5 border-t border-slate-100 pt-3 text-center text-[10px] text-slate-400"><Lock size={10} className="mb-0.5 mr-1 inline"/>Connexion sécurisée · D2D3.com SA</div>
    </div>
  </div>);
}

/* ---------- PARAMÈTRES (administration commune) ---------- */
const ROLES=["Administrateur","Gestionnaire","Encodeur","Consultation"];
const ROLE_DESC={Administrateur:"Tous droits, paramétrage, utilisateurs.",Gestionnaire:"Concessions, décès, plan, documents, facturation.",Encodeur:"Encodage des données, sans validation finale.",Consultation:"Lecture seule (carte, fiches)."};
function Switch({on,onClick,disabled}){return(<button disabled={disabled} onClick={onClick} className={`inline-flex h-5 w-9 items-center rounded-full transition ${on?"bg-[#CD0947]":"bg-slate-300"} ${disabled?"opacity-40":""}`}><span className={`mx-0.5 h-4 w-4 rounded-full bg-white transition ${on?"translate-x-4":""}`}/></button>);}
const ODS_PLATFORMS=[
  {id:"namur",nom:"data.namur.be — Ville de Namur",url:"https://data.namur.be"},
  {id:"odwb",nom:"ODWB — Open Data Wallonie‑Bruxelles",url:"https://www.odwb.be"},
  {id:"rw",nom:"Géoportail de la Wallonie (SPW)",url:"https://geoservices.wallonie.be"},
  {id:"custom",nom:"URL personnalisée…",url:""},
];
const NAMUR_DATASETS=["namur-cimetieres","namur-cimetieres-emplacements","namur-cimetieres-sepultures","namur-cimetieres-defunts","cim-sepultures-sihl-appli"];
function OpenDataConnector(){
  const [src,setSrc]=useState({plat:"namur",url:"https://data.namur.be",ds:"namur-cimetieres-defunts",token:""});
  const [test,setTest]=useState(null);
  const [pub,setPub]=useState({cible:"namur",ds:"namur-cimsystem-export",token:"",fmt:"csv"});
  const setPlat=id=>{const p=ODS_PLATFORMS.find(x=>x.id===id);setSrc(s=>({...s,plat:id,url:p&&p.url?p.url:s.url}));};
  const testConn=()=>{setTest({s:"loading"});
    fetch(`${src.url}/api/records/1.0/search/?dataset=${encodeURIComponent(src.ds)}&rows=0`)
      .then(r=>r.json()).then(j=>setTest({s:"ok",n:j.nhits!=null?j.nhits:"?"})).catch(()=>setTest({s:"err"}));};
  const prepareExport=()=>{
    if(pub.fmt==="geojson"){
      const feats=Object.values(RECORDS).slice(0,300).map(r=>({type:"Feature",properties:{ref:r.ref,cimetiere:r.cimetiere,nature:r.nature,statut:r.statut,octroi:r.octroi,expiration:r.expiration,denomination:r.denom1},geometry:null}));
      const gj={type:"FeatureCollection",features:feats};
      const blob=new Blob([JSON.stringify(gj,null,1)],{type:"application/geo+json"});const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download="cimsystem_export.geojson";a.click();URL.revokeObjectURL(u);
    }else{
      const lines=["ref;cimetiere;nature;statut;octroi;expiration;denomination"];
      Object.values(RECORDS).slice(0,300).forEach(r=>lines.push([r.ref,r.cimetiere,r.nature,r.statut,r.octroi,r.expiration,(r.denom1||"").replace(/;/g,",")].join(";")));
      const blob=new Blob(["\ufeff"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"});const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download="cimsystem_export.csv";a.click();URL.revokeObjectURL(u);
    }
    toast("Jeu de données préparé ("+pub.fmt.toUpperCase()+")");};
  return(<div className="space-y-4">
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-slate-800"><Download size={15} className="text-emerald-600"/>Source (lecture) — importer depuis une plateforme open data</h3>
      <p className="mb-3 text-[11.5px] text-slate-500">Connectez l'application à un portail Opendatasoft (data.namur.be, ODWB) ou au Géoportail wallon pour alimenter cartes et fiches avec des données officielles.</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <Field label="Plateforme"><Sel value={src.plat} onChange={e=>setPlat(e.target.value)}>{ODS_PLATFORMS.map(p=><option key={p.id} value={p.id}>{p.nom}</option>)}</Sel></Field>
        <Field label="URL de base"><Inp value={src.url} onChange={e=>setSrc(s=>({...s,url:e.target.value}))} placeholder="https://data.namur.be"/></Field>
        <Field label="Jeu de données">{src.plat==="namur"?<Sel value={src.ds} onChange={e=>setSrc(s=>({...s,ds:e.target.value}))}>{NAMUR_DATASETS.map(d=><option key={d}>{d}</option>)}</Sel>:<Inp value={src.ds} onChange={e=>setSrc(s=>({...s,ds:e.target.value}))}/>}</Field>
        <Field label="Jeton d'API (si requis)"><Inp value={src.token} onChange={e=>setSrc(s=>({...s,token:e.target.value}))} placeholder="facultatif"/></Field>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button onClick={testConn} className="rounded-md border border-slate-300 px-3.5 py-2 text-[12.5px] text-slate-700 hover:bg-slate-100">Tester la connexion</button>
        <button onClick={()=>toast("Import lancé — "+src.ds)} className="flex items-center gap-1.5 rounded-md bg-[#CD0947] px-3.5 py-2 text-[12.5px] font-medium text-white hover:opacity-90"><Download size={14}/>Importer le jeu</button>
        {test&&<span className={`text-[12px] ${test.s==="ok"?"text-emerald-600":test.s==="err"?"text-red-600":"text-slate-400"}`}>{test.s==="loading"?"Connexion…":test.s==="ok"?`Connecté · ${test.n} enregistrement(s)`:"Échec (vérifiez l'URL / connexion Internet)"}</span>}
      </div>
    </div>
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-slate-800"><Upload size={15} className="text-[#CD0947]"/>Diffusion (écriture) — publier vers l'open data</h3>
      <p className="mb-3 text-[11.5px] text-slate-500">Préparez et publiez un jeu de données issu de CIMSYSTEM (concessions, défunts publics) vers la plateforme open data de la commune ou de la Région.</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <Field label="Plateforme cible"><Sel value={pub.cible} onChange={e=>setPub(s=>({...s,cible:e.target.value}))}>{ODS_PLATFORMS.map(p=><option key={p.id} value={p.id}>{p.nom}</option>)}</Sel></Field>
        <Field label="Jeu de données cible"><Inp value={pub.ds} onChange={e=>setPub(s=>({...s,ds:e.target.value}))}/></Field>
        <Field label="Format d'export"><Sel value={pub.fmt} onChange={e=>setPub(s=>({...s,fmt:e.target.value}))}><option value="csv">CSV</option><option value="geojson">GeoJSON</option></Sel></Field>
        <Field label="Jeton de publication"><Inp value={pub.token} onChange={e=>setPub(s=>({...s,token:e.target.value}))} placeholder="clé API de gestion"/></Field>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button onClick={prepareExport} className="rounded-md border border-slate-300 px-3.5 py-2 text-[12.5px] text-slate-700 hover:bg-slate-100">Préparer l'export</button>
        <button onClick={()=>toast(pub.token?"Publication envoyée vers "+pub.ds:"Renseignez un jeton de publication")} className="flex items-center gap-1.5 rounded-md bg-[#CD0947] px-3.5 py-2 text-[12.5px] font-medium text-white hover:opacity-90"><Upload size={14}/>Publier vers la plateforme</button>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">La publication réelle s'appuie sur l'API de gestion Opendatasoft (push dataset) ou un dépôt DCAT ; elle nécessite une clé fournie par la plateforme cible.</p>
    </div>
  </div>);
}
function Activation2FA(){
  const [etat,setEtat]=useState("idle"); // idle | config | actif
  const [uri,setUri]=useState("");const [secret,setSecret]=useState("");const [codes,setCodes]=useState([]);
  const [code,setCode]=useState("");const [err,setErr]=useState("");
  const configurer=async()=>{setErr("");const r=await preparerMfa();if(!r){setErr("Connectez-vous avec le compte gestionnaire pour activer la 2FA (session requise).");return;}setUri(r.uri||"");setSecret(r.secret||"");setCodes(r.codesDeSecours||[]);setEtat("config");};
  const activer=async()=>{if(code.replace(/\D/g,"").length<6){setErr("Entrez le code à 6 chiffres.");return;}const ok=await confirmerMfa(code);if(ok){setEtat("actif");toast("2FA activée");}else setErr("Code invalide.");};
  return(<div className="rounded-lg border border-slate-200 p-3">
    <div className="flex items-center justify-between">
      <div><div className="text-[12.5px] font-medium text-slate-700">Authentification à deux facteurs (TOTP)</div>
        <div className="text-[11px] text-slate-500">Application d'authentification (Google Authenticator, itsme, etc.).</div></div>
      {etat==="actif"?<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">✓ Activée</span>
        :etat==="idle"?<button onClick={configurer} className="rounded-md bg-[#CD0947] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90">Configurer</button>:null}
    </div>
    {etat==="config"&&<div className="mt-3 grid gap-3 md:grid-cols-[160px_1fr]">
      <div className="text-center">{uri?<img src={qrDataURL(uri)} alt="QR 2FA" className="mx-auto h-36 w-36"/>:null}
        <div className="mt-1 break-all font-mono text-[9px] text-slate-400">{secret}</div></div>
      <div>
        <p className="text-[11.5px] text-slate-600">Scannez le QR, puis saisissez le code à 6 chiffres pour confirmer.</p>
        <div className="mt-2 flex gap-2">
          <input value={code} onChange={e=>setCode(e.target.value)} placeholder="••••••" className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-center tracking-[0.3em] text-[13px] outline-none"/>
          <button onClick={activer} className="rounded-md bg-[#15324a] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90">Activer</button>
        </div>
        {codes.length>0&&<div className="mt-3"><div className="text-[11px] font-medium text-slate-500">Codes de secours (à conserver) :</div>
          <div className="mt-1 grid grid-cols-2 gap-1 font-mono text-[11px] text-slate-700">{codes.map((c,i)=><span key={i} className="rounded bg-slate-50 px-1.5 py-0.5">{c}</span>)}</div></div>}
      </div>
    </div>}
    {err&&<div className="mt-2 rounded-md bg-red-50 px-2.5 py-1.5 text-[11.5px] text-red-700">{err}</div>}
  </div>);
}
function Parametres({commune,setCommune,ins,setIns,users,setUsers,enabled,setEnabled,allModules,mfa,setMfa}){
  const [tab,setTab]=useState("commune");
  const tabs=[["commune","Commune"],["users","Utilisateurs & rôles"],["modules","Modules"],["opendata","Open Data"],["delib","iA.Délib"],["fc","Forever Connected"],["secu","Sécurité"]];
  const ALWAYS=new Set(["dashboard","params"]);
  const toggleMod=k=>{if(ALWAYS.has(k))return;setEnabled(s=>{const n=new Set(s);n.has(k)?n.delete(k):n.add(k);return n;});};
  const updU=(i,kk,v)=>setUsers(us=>us.map((u,j)=>j===i?{...u,[kk]:v}:u));
  return(<div className="flex h-full flex-col bg-slate-50">
    <div className="flex gap-1 border-b border-slate-200 bg-white px-5 pt-3 text-[12.5px]">
      {tabs.map(([k,l])=><button key={k} onClick={()=>setTab(k)} className={`rounded-t-md px-3 py-2 ${tab===k?"border-b-2 border-[#CD0947] font-semibold text-slate-900":"text-slate-500 hover:text-slate-700"}`}>{l}</button>)}
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="mx-auto max-w-3xl">

      {tab==="commune"&&<div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-[13px] font-semibold text-slate-800">Identité de la commune</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Nom de la commune"><Inp value={commune} onChange={e=>setCommune(e.target.value)}/></Field>
          <Field label="Code INS"><Inp value={ins} onChange={e=>setIns(e.target.value)}/></Field>
          <Field label="Adresse de l'administration" full><Inp defaultValue="Place Communale 1"/></Field>
          <Field label="Gestionnaire référent"><Inp defaultValue="Philippe Baijot"/></Field>
          <Field label="Courriel du service"><Inp defaultValue="cimetieres@ville.namur.be"/></Field>
        </div>
        <button onClick={()=>toast("Paramètres de la commune enregistrés")} className="mt-4 flex items-center gap-1.5 rounded-md bg-[#CD0947] px-3.5 py-2 text-[12.5px] font-medium text-white hover:opacity-90"><Save size={15}/>Enregistrer</button>
      </div>}

      {tab==="users"&&<div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-1">
          <table className="w-full text-[12px]"><thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-slate-400">{["Nom","Courriel","Rôle","Actif",""].map(h=><th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
            <tbody>{users.map((u,i)=>(<tr key={i} className="border-t border-slate-100">
              <td className="px-2"><input value={u.nom} onChange={e=>updU(i,"nom",e.target.value)} className="w-full rounded border border-transparent px-1.5 py-1 text-[12px] hover:border-slate-200 focus:border-[#CD0947]/50 focus:bg-white outline-none"/></td>
              <td className="px-2"><input value={u.email} onChange={e=>updU(i,"email",e.target.value)} className="w-full rounded border border-transparent px-1.5 py-1 text-[12px] text-slate-600 hover:border-slate-200 focus:border-[#CD0947]/50 focus:bg-white outline-none"/></td>
              <td className="px-2"><select value={u.role} onChange={e=>updU(i,"role",e.target.value)} className="rounded border border-slate-200 px-1.5 py-1 text-[12px] outline-none">{ROLES.map(r=><option key={r}>{r}</option>)}</select></td>
              <td className="px-3"><Switch on={u.actif} onClick={()=>updU(i,"actif",!u.actif)}/></td>
              <td className="px-2 text-right"><button onClick={()=>setUsers(us=>us.filter((_,j)=>j!==i))} className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500"><Trash2 size={14}/></button></td>
            </tr>))}</tbody></table>
          <div className="px-3 pb-2"><button onClick={()=>setUsers(us=>[...us,{nom:"Nouvel utilisateur",email:"",role:"Consultation",actif:true}])} className="mt-2 flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-[12px] text-slate-500 hover:border-[#CD0947]/40 hover:text-[#CD0947]"><UserPlus size={14}/>Ajouter un utilisateur</button></div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-[13px] font-semibold text-slate-800">Rôles & permissions</h3>
          {ROLES.map(r=><div key={r} className="flex gap-3 border-t border-slate-50 py-1.5 first:border-0"><span className="w-32 shrink-0 text-[12px] font-medium text-slate-700">{r}</span><span className="text-[11.5px] text-slate-500">{ROLE_DESC[r]}</span></div>)}
        </div>
      </div>}

      {tab==="modules"&&<div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-1 text-[13px] font-semibold text-slate-800">Modules activés pour la commune</h3>
        <p className="mb-3 text-[11.5px] text-slate-500">Activez ou désactivez les onglets visibles dans l'application. Désactivé = masqué du menu.</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          {allModules.map(([k,label,icon])=>(<div key={k} className="flex items-center justify-between border-b border-slate-50 py-1.5">
            <span className="flex items-center gap-2 text-[12.5px] text-slate-700"><span className="text-slate-400">{icon}</span>{label}{k==="openmap"&&<span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700">public</span>}</span>
            <Switch on={enabled.has(k)} disabled={k==="dashboard"||k==="params"} onClick={()=>toggleMod(k)}/>
          </div>))}
        </div>
      </div>}

      {tab==="opendata"&&<OpenDataConnector/>}
      {tab==="delib"&&<DelibConnector/>}
      {tab==="fc"&&<FCConnector/>}

      {tab==="secu"&&<div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-[13px] font-semibold text-slate-800">Sécurité & connexion</h3>
        <Activation2FA/>
        <div className="flex items-center justify-between border-b border-slate-50 py-2"><div><div className="text-[12.5px] font-medium text-slate-700">Expiration de session</div><div className="text-[11px] text-slate-500">Déconnexion automatique après 30 min d'inactivité.</div></div><Switch on={true} onClick={()=>{}}/></div>
        <div className="flex items-center justify-between py-2"><div><div className="text-[12.5px] font-medium text-slate-700">Connexion via le Registre national (CSAM / itsme)</div><div className="text-[11px] text-slate-500">Authentification forte citoyenne (à brancher).</div></div><Switch on={false} onClick={()=>toast("À brancher en production")}/></div>
        <p className="text-[11px] text-slate-400">Journalisation des connexions et des accès activée (logs conformes RGPD).</p>
      </div>}

    </div></div>
  </div>);
}

/* ---------- OPENMAP — portail public citoyen ---------- */
function OpenMapPublic({cems,cemObj,onQR}){
  const [q,setQ]=useState({nom:"",annee:"",cimId:"Tous",sihl:false});
  const [sihlSel,setSihlSel]=useState(null);
  const [omFocus,setOmFocus]=useState(null);
  const [url,setUrl]=useState(null);
  const {st,data}=useNamur(url);
  const ds=q.sihl?"cim-sepultures-sihl-appli":"namur-cimetieres-defunts";
  const recs=((data&&data.records)||[]).map(r=>r.fields||{});
  const total=(data&&data.nhits)||0;
  const go=()=>{
    const parts=[`${ODS1}?dataset=${ds}&rows=60`];
    const qq=[q.nom.trim(),q.annee.trim()].filter(Boolean).join(" ");
    if(qq)parts.push(`q=${encodeURIComponent(qq)}`);
    if(q.cimId!=="Tous"){const c=cems.find(x=>x.id===q.cimId);if(c)parts.push(`refine.cimetiere=${encodeURIComponent(c.nom)}`);}
    setUrl(parts.join("&"));
  };
  useEffect(()=>{go();},[q.sihl]);
  const row=f=>({nom:pf(f,["nom","def_nom","nom_defunt","nom_complet"],""),prenom:pf(f,["prenom","prenoms","def_prenom"],""),
    naissance:pf(f,["date_naissance","naissance","annee_naissance","an_naissance"],""),deces:pf(f,["date_deces","deces","annee_deces","an_deces"],""),
    cim:pf(f,["cimetiere"],""),empl:pf(f,["emplacement","numero","empl_nom","alias","cim_code"],""),cat:pf(f,["categorie","type","intitule","theme"],"")});
  const rows=recs.map(row);
  const exportCSV=()=>{const head=["Nom","Prénom","Naissance","Décès","Cimetière","Emplacement"];
    const lines=[head.join(";"),...rows.map(r=>[r.nom,r.prenom,r.naissance,r.deces,r.cim,r.empl].map(x=>`"${(x+"").replace(/"/g,'""')}"`).join(";"))];
    const blob=new Blob(["\ufeff"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"});const u=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=u;a.download="namur_"+ds+".csv";a.click();URL.revokeObjectURL(u);toast("Export CSV téléchargé ("+rows.length+" lignes)");};
  return(<div className="flex h-full flex-col bg-slate-50">
    <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
      <Globe size={20} className="text-emerald-600"/>
      <div><h2 className="text-[14px] font-semibold text-slate-800">OpenMap — portail public citoyen · Ville de Namur</h2><p className="text-[11px] text-slate-500">Données officielles open data · {q.sihl?"Sépultures d'Importance Historique Locale (SIHL)":"défunts inhumés"} (RGPD : personnes vivantes masquées)</p></div>
      <button onClick={()=>onQR&&onQR({ref:"",defunt:""})} className="ml-auto flex items-center gap-1.5 rounded-md bg-[#CD0947] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90"><QrCode size={14}/>Commander une plaque QR mémorielle</button>
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">Vue citoyenne</span>
    </div>
    <div className="grid min-h-0 flex-1 grid-cols-[360px_1fr]">
      <div className="overflow-y-auto border-r border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400">Rechercher une sépulture</h3>
        <div className="space-y-3">
          <Field label="Nom du défunt"><Inp value={q.nom} onChange={e=>setQ(s=>({...s,nom:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="ex. Dupont"/></Field>
          <Field label="Année (naissance ou décès)"><Inp value={q.annee} onChange={e=>setQ(s=>({...s,annee:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="ex. 1918"/></Field>
          <Field label="Cimetière"><Sel value={q.cimId} onChange={e=>setQ(s=>({...s,cimId:e.target.value}))}><option value="Tous">Tous les cimetières</option>{cems.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</Sel></Field>
          <label className="flex items-center gap-2 text-[12px] text-slate-600"><input type="checkbox" checked={q.sihl} onChange={e=>setQ(s=>({...s,sihl:e.target.checked}))}/>Tombes remarquables / personnalités (SIHL)</label>
          <button onClick={go} className="w-full rounded-md bg-[#CD0947] py-2 text-[12.5px] font-medium text-white hover:opacity-90">Rechercher</button>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11.5px] text-slate-500">{st==="ok"?<><b>{rows.length}</b>{total>rows.length?` / ${total}`:""} résultat(s)</>:st==="loading"?"Chargement…":st==="empty"?"Aucun résultat":st==="error"?"Hors‑ligne":"—"}</span>
          <button onClick={exportCSV} disabled={!rows.length} className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-[12px] text-slate-700 hover:bg-slate-100 disabled:opacity-40"><Download size={14}/>Exporter CSV</button>
        </div>
        <StatusLine st={st} empty="Aucune sépulture trouvée."/>
        <div className="mt-2 max-h-[calc(100vh-380px)] overflow-y-auto rounded-lg border border-slate-200">
          <table className="w-full text-[11.5px]"><thead className="sticky top-0 bg-slate-50"><tr className="text-left text-[10px] uppercase tracking-wide text-slate-400">{["Nom","Décès","Cimetière"].map(h=><th key={h} className="px-2 py-1.5">{h}</th>)}</tr></thead>
            <tbody>{rows.map((d,i)=>(<tr key={i} onClick={()=>{const c=cems.find(x=>x.nom===d.cim);if(c&&c.coord)setOmFocus({coord:c.coord,zoom:17,key:Date.now()});if(q.sihl)setSihlSel(recs[i]);}} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50">
              <td className="px-2 py-1.5 font-medium text-slate-800">{d.nom} {d.prenom}{q.sihl&&d.cat&&<span className="ml-1 rounded bg-amber-100 px-1 text-[9px] text-amber-700">{(""+d.cat).slice(0,18)}</span>}</td>
              <td className="px-2 py-1.5 font-mono text-slate-500">{d.deces}</td>
              <td className="px-2 py-1.5 text-slate-600">{d.cim} {d.empl&&<>· {d.empl}</>}</td></tr>))}</tbody></table>
        </div>
        <p className="mt-1 text-[10.5px] text-emerald-600">{q.sihl?"Cliquez une personnalité pour sa fiche (bio + QR) et zoomer sur la carte.":"Cliquez un défunt pour zoomer sur son cimetière."}</p>
        <p className="mt-2 text-[10.5px] text-slate-400">Source : data.namur.be · jeu « {ds} ». Mise à jour quotidienne.</p>
      </div>
      <div className="relative min-h-0"><NamurMap cem={cemObj} field="type" focus={omFocus}/>
        <div className="pointer-events-none absolute left-2 bottom-7 z-[500] rounded-md bg-white/90 px-2.5 py-1 text-[11px] text-slate-600 shadow">Carte publique · cliquez un emplacement pour les informations</div>
      </div>
    </div>
    {sihlSel&&<SihlFicheModal f={sihlSel} onClose={()=>setSihlSel(null)}/>}
  </div>);
}

export default function App(){
  const [authed,setAuthed]=useState(false);
  const [authUser,setAuthUser]=useState("");
  const [commune,setCommune]=useState("Gerpinnes");
  const [ins,setIns]=useState("92094");
  const [mfa,setMfa]=useState(true);
  const [users,setUsers]=useState([
    {nom:"Philippe Baijot",email:"p.baijot@ville.namur.be",role:"Administrateur",actif:true},
    {nom:"Service Population",email:"population@ville.namur.be",role:"Gestionnaire",actif:true},
    {nom:"Fossoyeur — équipe Nord",email:"fossoyeurs@ville.namur.be",role:"Encodeur",actif:true},
    {nom:"Accueil citoyen",email:"accueil@ville.namur.be",role:"Consultation",actif:false},
  ]);
  const [enabled,setEnabled]=useState(()=>new Set(MODULES.map(m=>m[0])));
  const [calEvents,setCalEvents]=useState(SEED_EV);
  const [invoices,setInvoices]=useState([]);
  const [delibs,setDelibs]=useState(SEED_DELIBS);
  const [delibSrc,setDelibSrc]=useState(null);
  const pushDelib=(p)=>{setDelibs(s=>[p,...s]);toast("Point envoyé à iA.Délib — "+DELIB_CONFIGS[p.type].label);envoyerDeliberation(p);};
  const [fcOrders,setFcOrders]=useState(SEED_FC);
  const [fcSrc,setFcSrc]=useState(null);
  const pushFC=(o)=>{setFcOrders(s=>[o,...s]);toast("Commande QR transmise à Forever Connected — "+o.produit);envoyerCommandeQR(o);};
  const [dbConcessions,setDbConcessions]=useState(null);
  const [emplGeo,setEmplGeo]=useState(null);
  const statutByRef=useMemo(()=>{const m={};(dbConcessions||[]).forEach(r=>{m[r.ref]=r.statut;});return m;},[dbConcessions]);
  useEffect(()=>{
    chargerConcessions().then(rows=>setDbConcessions(Array.isArray(rows)?rows:[])).catch(()=>setDbConcessions([]));
    chargerDeliberations().then(rows=>{if(rows&&rows.length)setDelibs(rows);}).catch(()=>{});
    chargerCommandesQR().then(rows=>{if(rows&&rows.length)setFcOrders(rows);}).catch(()=>{});
  },[]);
  const [mod,setMod]=useState("plan");
  const [cems,setCems]=useState(CEMETERIES.map(c=>({...c})));
  const [cem,setCem]=useState(CEMETERIES[0].id);
  useEffect(()=>{
    fetch(`${ODS}namur-cimetieres/records?limit=100`).then(r=>r.json()).then(j=>{
      const live=(j.results||[]).map(rec=>{
        const nom=rec.cimetiere||rec.nom||rec.libelle||rec.nom_cimetiere||"";
        let gp=rec.geo_point_2d||rec.geopoint||rec.geo_point,lat,lon;
        if(Array.isArray(gp)){lat=gp[0];lon=gp[1];}else if(gp&&typeof gp==="object"){lat=gp.lat;lon=gp.lon;}
        return {nom,coord:(lat&&lon)?[lat,lon]:null};
      }).filter(c=>c.coord);
      if(live.length)setCems(CEMETERIES.map(c=>{const m=live.find(l=>l.nom&&l.nom.toLowerCase().includes(c.nom.toLowerCase()));return m?{...c,coord:m.coord}:{...c};}));
    }).catch(()=>{});
  },[]);
  const [search,setSearch]=useState("");
  const [openRef,setOpenRef]=useState(null);
  const [extra,setExtra]=useState({});
  const dbByRef=useMemo(()=>{const m={};(dbConcessions||[]).forEach(r=>{m[r.ref]=r;});return m;},[dbConcessions]);
  const recordFor=ref=>extra[ref]||dbByRef[ref]||RECORDS[ref];
  const createConcession=rec=>{setExtra(e=>({...e,[rec.ref]:rec}));setMod("concessions");setOpenRef(rec.ref);toast("Concession "+rec.ref+" créée");envoyerConcession(rec);};
  const normalizeImported=rec=>{
    const base=buildRecord({ref:rec.ref,nature:rec.nature||"caveau",statut:rec.statut||"occupe"});
    const m={...base,...rec};
    m.personnes={concessionnaire:[],responsable:[],beneficiaire:[],autre:[],...(rec.personnes||{})};
    if(!(m.personnes.responsable&&m.personnes.responsable.length)&&m.personnes.concessionnaire&&m.personnes.concessionnaire.length)m.personnes.responsable=m.personnes.concessionnaire.slice(0,1);
    m.inhumes=rec.inhumes||[];m.prorogations=rec.prorogations||[];m.monument=rec.monument||base.monument;
    m.etat={...base.etat,...(rec.etat||{})};m.documents=rec.documents||base.documents||[];
    m.historique=rec.historique||base.historique||[];m.notesTerrain=rec.notesTerrain||base.notesTerrain||{};
    m.cendres=rec.cendres||base.cendres||{};m.sihl=rec.sihl||null;
    const tot=+m.placesTot||base.placesTot||0,occ=+m.placesOcc||0;
    const lab=tot===4?["Étage haut – Gauche","Étage haut – Droite","Étage bas – Gauche","Étage bas – Droite"]:null;
    const cells=[];for(let i=0;i<tot;i++)cells.push({pos:lab?lab[i]:`Position ${i+1}`,occupe:i<occ,nom:i<occ?(m.inhumes[i]?.nom||null):null,date:i<occ?(m.inhumes[i]?.inhum||null):null});
    m.cells=cells;m.placesOcc=occ;m.placesTot=tot;m.placesDisp=Math.max(0,tot-occ);
    return m;
  };
  const importConcessions=recs=>{const norm=(recs||[]).map(normalizeImported);setExtra(e=>{const n={...e};norm.forEach(r=>{if(r.ref)n[r.ref]=r;});return n;});setMod("concessions");setOpenRef(null);toast(norm.length+" concession(s) importée(s)");};
  const [interventions,setInterventions]=useState(SEED_INTERV);
  const addIntervention=iv=>setInterventions(s=>[iv,...s]);
  const setIvStatut=(id,st)=>setInterventions(s=>s.map(i=>i.id===id?{...i,statut:st}:i));
  const namurNat=t=>{t=(t||"").toLowerCase();if(t.includes("caveau"))return"caveau";if(t.includes("colomb")||t.includes("columb")||t.includes("ciné")||t.includes("cine"))return"columbarium";if(t.includes("urne")||t.includes("cavurne"))return"cavurne";if(t.includes("disper"))return"dispersion";if(t.includes("ossuaire"))return"ossuaire";return"pleine_terre";};
  const openFeature=p=>{p=p||{};
    const ref=[p.carre,p.rangee,p.numero].filter(x=>x!=null&&x!=="").join("/")||p.emplacement||("Namur-"+(p.numero||Math.random().toString(36).slice(2,6)));
    const rec=normalizeImported({ref,cimetiere:p.cimetiere||"Cimetière de Namur",nature:namurNat(p.type),statut:"occupe",denom1:p.type_specifique||p.type||"Emplacement",numInterne:p.numero,observations:p.type?("Type open data : "+p.type):"" ,_saphir:p});
    setExtra(e=>({...e,[ref]:rec}));setOpenRef(ref);toast("Fiche de l'emplacement "+ref);};
  const [aN,setAN]=useState(new Set(Object.keys(NATURES)));
  const [aS,setAS]=useState(new Set(Object.keys(STATUTS)));
  const dim=useCallback(p=>{if(p.nature&&!aN.has(p.nature))return true;if(!aS.has(p.statut))return true;if(search.trim()){const r=RECORDS[p.ref];if(!((p.ref+" "+(r?.denom1||"")).toLowerCase().includes(search.toLowerCase())))return true;}return false;},[aN,aS,search]);
  const [thematique,setThematique]=useState("nature");
  const [showCreate,setShowCreate]=useState(false);
  const yearsTo=p=>{const m=(""+(RECORDS[p.ref]?.expiration)).match(/\d{4}/);return m?(+m[0]-2026):null;};
  const colorOf=useCallback(p=>{
    if(p.statut==="libre")return "#F4F7F3";
    if(thematique==="statut")return STATUTS[p.statut].ring;
    if(thematique==="echeance"){const d=yearsTo(p);if(d===null)return "#94A3B8";if(d<0)return "#C0392B";if(d<3)return "#E08E33";return "#2E971F";}
    if(thematique==="duree"){const r=RECORDS[p.ref];const dd=(r?.duree||"").includes("Perp")?99:(parseInt(r?.duree)||30);return dd>=50?"#1D48CC":dd>=30?"#7D7C83":"#A88E6A";}
    return p.nature?NATURES[p.nature].color:"#cbd5e1";
  },[thematique]);
  const updateRecord=(ref,patch)=>{setExtra(e=>({...e,[ref]:{...(e[ref]||dbByRef[ref]||RECORDS[ref]),...patch}}));majConcession(ref,patch);};
  const [planHist,setPlanHist]=useState(false);
  const [planYear,setPlanYear]=useState(2026);
  const yearOf=s=>{const m=(""+s).match(/(\d{4})/);return m?+m[1]:null;};
  const statutAt=(p,yr)=>{const r=RECORDS[p.ref];if(!r||p.statut==="libre")return "libre";const oc=yearOf(r.octroi),ex=yearOf(r.expiration);if(oc&&yr<oc)return "libre";if(ex&&yr>=ex)return "echue";return "occupe";};
  const colorOfH=useCallback(p=>{if(planHist){const s=statutAt(p,planYear);return s==="libre"?"#F4F7F3":STATUTS[s].ring;}return colorOf(p);},[planHist,planYear,colorOf]);
  const dimH=useCallback(p=>{if(planHist){const oc=yearOf(RECORDS[p.ref]?.octroi);return oc?planYear<oc:false;}return dim(p);},[planHist,planYear,dim]);
  const [planView,setPlanView]=useState("osm");
  const [showPrint,setShowPrint]=useState(false);
  const cemObj=cem==="all"?{id:"all",nom:"Gerpinnes (tous)",commune:"Gerpinnes",coord:[50.3377,4.5157]}:(cems.find(c=>c.id===cem)||cems[0]);
  const selCimDemo=cem==="all"?"Tous":cemObj.nom;
  useEffect(()=>{
    const q=cem==="all"?"":`?cimetiere=${encodeURIComponent(cemObj.nom)}`;
    let annule=false;
    fetch(`/api/emplacements${q}`).then(r=>r.json()).then(fc=>{if(!annule)setEmplGeo(fc);}).catch(()=>{});
    return ()=>{annule=true;};
  },[cem]);
  const PF2_BASE=FILTER_DEFAULT;
  const [pf2,setPf2]=useState({...FILTER_DEFAULT,cim:CEMETERIES[0].nom});
  useEffect(()=>{setPf2(s=>({...s,cim:selCimDemo}));},[selCimDemo]);
  const [mapFocus,setMapFocus]=useState(null);
  const pf2Active=filterActive(pf2);
  const recMatches=(r)=>matchRec(r,pf2);
  const planResults=PLOTS.map(p=>recordFor(p.ref)).filter(r=>r&&r.statut!=="libre").filter(recMatches);
  const cemCoordByName=n=>{const c=CEMETERIES.find(x=>x.nom===n)||cems.find(x=>x.nom===n);return c&&c.coord;};
  const onLocate=(r)=>{if(planView==="osm"){const co=cemCoordByName(r.cimetiere);if(co){setMapFocus({coord:co,zoom:17,key:Date.now()});toast(`Localisé : ${r.ref} · ${r.cimetiere}`);}else setOpenRef(r.ref);}else setOpenRef(r.ref);};
  const resetPf2=()=>setPf2({...PF2_BASE,cim:selCimDemo});
  const goToPlan=(ref)=>{const r=recordFor(ref);if(!r)return;
    const c=CEMETERIES.find(x=>x.nom===r.cimetiere);
    if(c)setCem(c.id);
    setPf2(s=>({...s,cim:r.cimetiere,ref:r.ref}));
    setOpenRef(null);setMod("plan");
    if(c&&c.coord)setMapFocus({coord:c.coord,zoom:18,key:Date.now()});
    toast(`Plan — ${r.ref} · ${r.cimetiere}`);};
  const dimF=useCallback(p=>{if(dimH(p))return true;if(pf2Active){const r=RECORDS[p.ref];if(!recMatches(r))return true;}return false;},[dimH,pf2]);
  const toggle=(set,setter,k)=>{const n=new Set(set);n.has(k)?n.delete(k):n.add(k);setter(n);};

  if(!authed)return <Login commune={commune} onLogin={u=>{setAuthUser(u);setAuthed(true);}}/>;
  const visibleModules=MODULES.filter(([k])=>enabled.has(k));

  return(<div className="flex h-screen min-h-[640px] w-full bg-slate-100 text-slate-900" style={{fontFamily:"Inter,ui-sans-serif,system-ui,sans-serif"}}>
    {/* module rail */}
    {/* sidebar blanc */}
    <Toaster/>
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center justify-center border-b border-slate-100 px-4 py-3"><D2D3Logo className="h-8 w-auto"/></div>
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#CD0947] text-[11px] font-bold text-white">PB</div>
        <div className="leading-tight"><div className="text-[12.5px] font-medium text-slate-800">Philippe Baijot</div><div className="text-[10px] text-slate-400">Gestionnaire · {commune}</div></div>
      </div>
      <nav className="flex-1 overflow-y-auto py-1.5">
        {visibleModules.map(([k,label,icon])=>{const on=mod===k&&!openRef;return(
          <button key={k} onClick={()=>{setMod(k);setOpenRef(null);}} className={`flex w-full items-center gap-3 border-l-2 px-4 py-2 text-left text-[12.5px] ${on?"border-[#CD0947] bg-slate-100 font-medium text-slate-900":"border-transparent text-slate-600 hover:bg-slate-50"}`}>
            <span className={on?"text-[#CD0947]":"text-slate-400"}>{icon}</span><span className="flex-1">{label}</span><ChevronDown size={14} className="text-slate-300"/>
          </button>);})}
      </nav>
      <div className="border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">CIMSYSTEM V2 — maquette</div>
    </aside>

    <div className="flex min-w-0 flex-1 flex-col">
      {/* top bar rouge (couleur de marque) */}
      <header className="flex items-center gap-3 bg-[#CD0947] px-3 py-2 text-white">
        <button className="rounded p-1.5 text-white/90 hover:bg-white/15"><Menu size={18}/></button>
        <span className="text-[15px] font-bold tracking-wide">CIMSYSTEM<span className="font-light opacity-80"> V2</span></span>
        <div className="relative ml-1"><select value={cem} onChange={e=>setCem(e.target.value)} className="appearance-none rounded-md border border-white/30 bg-white/10 py-1.5 pl-8 pr-7 text-[12px] text-white outline-none"><option value="all" className="text-slate-800">Tous les cimetières</option>{cems.map(c=><option key={c.id} value={c.id} className="text-slate-800">{c.nom}</option>)}</select><MapPin size={14} className="pointer-events-none absolute left-2.5 top-2 text-white/80"/></div>
        <div className="relative w-64"><Search size={14} className="pointer-events-none absolute left-2.5 top-2 text-white/70"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un village, une concession…" className="w-full rounded-md border border-white/30 bg-white/10 py-1.5 pl-8 pr-3 text-[12px] text-white placeholder-white/70 outline-none focus:bg-white/20"/></div>
        <div className="mx-1 h-7 w-px bg-white/25"/>
        <CimToolbar/>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="hidden text-[11px] text-white/80 lg:block">{commune}</span>
          <button onClick={()=>{setMod("params");setOpenRef(null);}} title="Paramètres" className="grid h-8 w-8 place-items-center rounded-full border border-white/40 text-white hover:bg-white/20"><Settings size={15}/></button>
          <button onClick={()=>{setAuthed(false);setMod("plan");}} title="Déconnexion" className="grid h-8 w-8 place-items-center rounded-full border border-white/40 text-white hover:bg-white/20"><LogOut size={15}/></button>
        </div>
      </header>

      {/* content */}
      <main className="min-h-0 flex-1">
        {openRef?(<Dossier rec={recordFor(openRef)} onBack={()=>setOpenRef(null)} interventions={interventions} onAddIntervention={addIntervention} onUpdateRecord={updateRecord} onPlan={goToPlan} onQR={setFcSrc}/>):(<>
          {mod==="plan"&&<div className="flex h-full flex-col">
            <FilterBar val={pf2} setVal={setPf2} results={planResults} onLocate={onLocate} onReset={resetPf2}/>
            <div className="flex min-h-0 flex-1">
              <LayerTree thematique={thematique} setThematique={setThematique} onCreate={()=>setShowCreate(true)}/>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-3 py-1.5 text-[12px]">
                  <button onClick={()=>setPlanView("osm")} className={`rounded-md px-3 py-1 ${planView==="osm"?"bg-[#CD0947] text-white":"text-slate-600 hover:bg-slate-100"}`}>Carte (OpenStreetMap)</button>
                  <button onClick={()=>setPlanView("svg")} className={`rounded-md px-3 py-1 ${planView==="svg"?"bg-[#CD0947] text-white":"text-slate-600 hover:bg-slate-100"}`}>Schéma</button>
                  {planView==="svg"&&<label className="ml-2 flex items-center gap-1.5 text-[11.5px] text-slate-600"><input type="checkbox" checked={planHist} onChange={e=>setPlanHist(e.target.checked)}/><History size={13}/>Historique du plan</label>}
                  {planView==="svg"&&planHist&&<div className="flex items-center gap-2"><input type="range" min="1985" max="2026" value={planYear} onChange={e=>setPlanYear(+e.target.value)} className="w-44 accent-[#CD0947]"/><span className="font-mono text-[12px] font-semibold text-[#CD0947]">{planYear}</span></div>}
                  <span className="ml-auto font-mono text-[11px] text-slate-400">{cemObj&&cemObj.nom} {cemObj&&cemObj.coord?`· ${cemObj.coord[0].toFixed(4)}, ${cemObj.coord[1].toFixed(4)}`:""}</span>
                  <button onClick={()=>setShowPrint(true)} className="ml-2 flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1 text-[12px] text-slate-700 hover:bg-slate-100"><Printer size={14}/>Imprimer (A4/A3)</button>
                </div>
                <div className="relative min-h-0 flex-1">
                  {planView==="osm"
                    ? <NamurMap cem={cemObj} field={thematique==="statut"?"type_specifique":thematique==="duree"?"carre":"type"} onOpen={openFeature} focus={mapFocus} empl={emplGeo} statutByRef={statutByRef} onEmpl={(ref)=>{ if(recordFor(ref)) setOpenRef(ref); else toast("Emplacement "+ref+" — aucune concession enregistrée"); }}/>
                    : <PlanCanvas plots={PLOTS} selected={null} onSelect={setOpenRef} dim={dimF} colorOf={colorOfH}/>}
                  {showCreate&&<CreateEmplacement onClose={()=>setShowCreate(false)}/>}
                  {showPrint&&<PrintMapModal plots={PLOTS} colorOf={colorOfH} cem={cemObj} onClose={()=>setShowPrint(false)}/>}
                </div>
              </div>
            </div>
          </div>}
          {mod==="concessions"&&<Concessions onOpen={setOpenRef} search={search} extra={extra} onCreate={createConcession} defaultCim={selCimDemo} onPlan={goToPlan} dbRows={dbConcessions}/>}
          {mod==="deces"&&<DecesModule onAddEvent={ev=>{setCalEvents(s=>[...s,ev]);}} events={calEvents} onAddInvoice={inv=>setInvoices(s=>[inv,...s])}/>}
          {mod==="marbriers"&&<MarbrierForm/>}
          {mod==="documents"&&<Documents records={{...RECORDS,...extra}}/>}
          {mod==="calendrier"&&<Calendrier events={calEvents} setEvents={setCalEvents}/>}
          {mod==="exhumations"&&<Exhumations onDelib={setDelibSrc}/>}
          {mod==="reprises"&&<Reprises onOpen={setOpenRef} onDelib={setDelibSrc}/>}
          {mod==="delib"&&<DelibModule delibs={delibs}/>}
          {mod==="qrmemo"&&<QRMemorielModule orders={fcOrders} onQR={setFcSrc}/>}
          {mod==="demandes"&&<Demandes/>}
          {mod==="patrimoine"&&<Patrimoine onOpen={setOpenRef}/>}
          {mod==="facturation"&&<Facturation extra={invoices}/>}
          {mod==="public"&&<PortailPublic onQR={setFcSrc}/>}
          {mod==="config"&&<Configuration/>}
          {mod==="reprise"&&<RepriseImport onImport={importConcessions}/>}
          {mod==="interventions"&&<Interventions interventions={interventions} records={{...RECORDS,...extra}} onAdd={addIntervention} onStatut={setIvStatut}/>}
          {mod==="openmap"&&<OpenMapPublic cems={cems} cemObj={cemObj} onQR={setFcSrc}/>}
          {mod==="params"&&<Parametres commune={commune} setCommune={setCommune} ins={ins} setIns={setIns} users={users} setUsers={setUsers} enabled={enabled} setEnabled={setEnabled} allModules={MODULES} mfa={mfa} setMfa={setMfa}/>}
          {mod==="dashboard"&&<Dashboard/>}
        </>)}
      </main>
    </div>
    {delibSrc&&<DelibPushModal src={delibSrc} onClose={()=>setDelibSrc(null)} onPush={pushDelib}/>}
    {fcSrc&&<FCOrderModal src={fcSrc} onClose={()=>setFcSrc(null)} onOrder={pushFC}/>}
  </div>);
}
