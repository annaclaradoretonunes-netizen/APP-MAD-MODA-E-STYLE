// O Metro/Expo inclui automaticamente todas as fotografias JPEG e PNG desta pasta.
// As fotos permanecem completas, sem recortes de roupas.
const photos=require.context('../assets/looks',false,/\.(jpe?g|png)$/i);
export const localLooks=photos.keys().sort().map((key,index)=>({
 id:'editorial-'+index,
 local:true,
 image:photos(key),
 title:'Inspiração MAD '+String(index+1).padStart(2,'0'),
 style:'A classificar',
 pieces:['Fotografia original do look completo','Descrição das peças pendente de revisão visual']
}));
