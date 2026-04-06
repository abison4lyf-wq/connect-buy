export const LOCATIONS_DATA: Record<string, string[]> = {
  "Lagos": ["Ikeja", "Alimosho", "Lagos Island", "Ikorodu", "Epe", "Surulere", "Badagry", "Oshodi-Isolo", "Eti-Osa"],
  "Ogun": ["Abeokuta South", "Abeokuta North", "Ijebu Ode", "Sagamu", "Ota", "Ilaro", "Ikenne"],
  "Oyo": ["Ibadan North", "Ibadan South East", "Ogbomosho South", "Oyo East", "Iseyin", "Ibadan South West", "Ogbomosho North", "Saki West"],
};

export const ALL_LOCATIONS = Object.entries(LOCATIONS_DATA).flatMap(([state, lgas]) => 
  lgas.map(lga => ({ state, lga }))
);
