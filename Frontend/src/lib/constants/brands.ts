// Store-supplied brands and product lines. Keep the supplied names and official URLs here.
export const brands = [
  { name: 'Panasonic', url: 'https://www.panasonic.com/in/' },
  { name: 'Canon', url: 'https://global.canon/en/' },
  { name: 'Fujinon', url: 'https://www.fujifilm.com/' },
  { name: 'Blackmagic Design', url: 'https://www.blackmagicdesign.com/' },
  { name: 'Ross Video', url: 'https://www.rossvideo.com/' },
  { name: 'Datavideo', url: 'https://www.datavideo.com/' },
  { name: 'FOR-A', url: 'https://www.for-a.com/' },
  { name: 'AJA', url: 'https://www.aja.com/' },
  { name: 'AVMATRIX', url: 'https://www.avmatrix.com/' },
  { name: 'NewTek', url: 'https://www.newtek.com/' },
  { name: 'Sennheiser', url: 'https://en-in.sennheiser.com/' },
  { name: 'Yamaha (Pro Audio)', url: 'https://www.yamaha.com/' },
  { name: 'Tannoy', url: 'https://www.tannoy.com/' },
  { name: 'RØDE', url: 'https://rode.com/' },
  { name: 'Audio-Technica', url: 'https://www.audio-technica.com/' },
  { name: 'Neumann', url: 'https://www.neumann.com/' },
  { name: 'AKG', url: 'https://www.akg.com/' },
  { name: 'Harman', url: 'https://www.harman.com/' },
  { name: 'JBL Professional', url: 'https://jblpro.com/' },
  { name: 'Soundcraft', url: 'https://www.soundcraft.com/' },
  { name: 'Crown Audio', url: 'https://www.crownaudio.com/' },
  { name: 'Dejero EnGo 3', url: 'https://www.dejero.com/products/engo-3/' },
  { name: 'ATC Labs', url: 'https://www.atc-labs.com/' },
  { name: 'Habari Teleprompter', url: 'https://www.habariteleprompter.com/' },
  { name: 'Absen', url: 'https://www.absen.com/' },
  { name: 'LG Display', url: 'https://www.lgdisplay.com/eng' },
  { name: 'Miliboo', url: 'https://www.miliboo.com/' },
  { name: 'MaxHub', url: 'https://www.maxhub.com/' },
  { name: 'Canare', url: 'https://www.canare.com/' },
  { name: 'Belden', url: 'https://www.belden.com/' },
  { name: 'APW President', url: 'https://www.apwpresident.com/' },
  { name: 'Neutrik', url: 'https://www.neutrik.com/' },
  { name: 'Netrack', url: 'https://www.netrackindia.com/' },
  { name: 'HP (Hewlett-Packard)', url: 'https://www.hp.com/' },
  { name: 'Dell', url: 'https://www.dell.com/' },
  { name: 'Hako', url: 'https://www.hakoindia.com/' },
  { name: 'Prompter People', url: 'https://www.prompterpeople.com/' },
  { name: 'LiveU', url: 'https://www.liveu.tv/' },
  { name: 'Grass Valley', url: 'https://www.grassvalley.com/' },
  { name: 'Kapture', url: 'https://www.kaptureindia.com/' },
  { name: 'DAC / alto archive', url: 'https://www.dalet.com/' },
  { name: 'Infortrend', url: 'https://www.infortrend.com/' },
  { name: 'Harmonic', url: 'https://www.harmonicinc.com/' },
] as const;

export function findBrand(name?: string) {
  return brands.find((brand) => brand.name.toLowerCase() === name?.trim().toLowerCase());
}

export function brandCatalogHref(name: string) {
  return `/products?${new URLSearchParams({ brand: name })}`;
}
