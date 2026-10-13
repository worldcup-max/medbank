export const SPECS = {
  sn2: { title:"SN2", states:[
    { name:"Reactants", smiles:"[OH-:1].[CH3:2][C@H:3]([Br:4])[CH2:5][CH3:6]", energy:0 },
    { name:"Products", smiles:"[OH:1][C@H:3]([CH3:2])[CH2:5][CH3:6].[Br-:4]", energy:-0.4 } ],
    arrows:[[{from:[1],to:[1,3]},{from:[3,4],to:[4]}]], barriers:[1] },
  sn1: { title:"SN1", states:[
    { name:"Reactants", smiles:"[CH3:1][C:2]([CH3:3])([CH3:4])[Br:5].[OH:6][H:8].[OH2:7]", energy:0 },
    { name:"Carbocation", smiles:"[CH3:1][C+:2]([CH3:3])[CH3:4].[Br-:5].[OH:6][H:8].[OH2:7]", energy:0.6 },
    { name:"Oxonium ion", smiles:"[CH3:1][C:2]([CH3:3])([CH3:4])[OH+:6][H:8].[Br-:5].[OH2:7]", energy:0.1 },
    { name:"Products", smiles:"[CH3:1][C:2]([CH3:3])([CH3:4])[OH:6].[Br-:5].[OH2+:7][H:8]", energy:-0.2 } ],
    arrows:[[{from:[2,5],to:[5]}],[{from:[6],to:[6,2]}],[{from:[7],to:[7,8]},{from:[6,8],to:[6]}]], barriers:[1,0.3,0.2] },
  e2: { title:"E2", states:[
    { name:"Reactants", smiles:"[OH-:1].[CH3:2][CH:3]([Br:4])[CH2:5][H:6]", energy:0 },
    { name:"Products", smiles:"[OH:1][H:6].[CH3:2][CH:3]=[CH2:5].[Br-:4]", energy:-0.3 } ],
    arrows:[[{from:[1],to:[1,6]},{from:[5,6],to:[5,3]},{from:[3,4],to:[4]}]], barriers:[0.9] },
  addn: { title:"Cyanide adds to ethanal", states:[
    { name:"Reactants", smiles:"[C-:1]#[N:2].[CH3:3][CH:4]=[O:5].[OH:6][H:7]", energy:0 },
    { name:"Alkoxide", smiles:"[N:2]#[C:1][CH:4]([CH3:3])[O-:5].[OH:6][H:7]", energy:0.2 },
    { name:"Hydroxynitrile", smiles:"[N:2]#[C:1][CH:4]([CH3:3])[O:5][H:7].[OH-:6]", energy:-0.1 } ],
    arrows:[[{from:[1],to:[1,4]},{from:[4,5],to:[5]}],[{from:[5],to:[5,7]},{from:[6,7],to:[6]}]], barriers:[0.6,0.3] },
};
