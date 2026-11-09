import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {styles as categories, looks as samples} from './src/looks';
import {supabase} from './src/supabase';

const COVER_IMAGE=require('./assets/cover/1000359909.png');
const PINK='#E8A9BF', DARK='#7A3857', PALE='#FFF1F6';
const OPTIONS=categories.filter(x=>x!=='Todos');
const notify=e=>Alert.alert('MAD Closet',e?.message||'Não foi possível concluir a operação.');
const Action=({label,onPress,outline=false,disabled=false})=><TouchableOpacity onPress={onPress} disabled={disabled} style={[s.action,outline&&s.outline,disabled&&{opacity:.5}]}><Text style={[s.actionText,outline&&{color:DARK}]}>{label}</Text></TouchableOpacity>;

export default function App(){
 const authScroll=useRef(null);
 const [session,setSession]=useState(null),[boot,setBoot]=useState(true),[busy,setBusy]=useState(false);
 const [authScreen,setAuthScreen]=useState('welcome'),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [selected,setSelected]=useState([]),[preferences,setPreferences]=useState([]),[prefLoading,setPrefLoading]=useState(true),[editing,setEditing]=useState(false);
 const [tab,setTab]=useState('Início'),[category,setCategory]=useState('Todos'),[query,setQuery]=useState('');
 const [dbLooks,setDbLooks]=useState([]),[feedLoading,setFeedLoading]=useState(false),[saved,setSaved]=useState([]),[savedLoading,setSavedLoading]=useState(false);

 useEffect(()=>{
  if(!supabase){setBoot(false);return;}
  supabase.auth.getSession().then(({data,error})=>{if(error)notify(error);setSession(data?.session||null);setBoot(false);});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next));
  return ()=>subscription.unsubscribe();
 },[]);

 useEffect(()=>{
  if(!session?.user?.id){setPrefLoading(false);setPreferences([]);setSelected([]);setEditing(false);return;}
  let active=true;setPrefLoading(true);
  supabase.from('user_style_preferences').select('aesthetic').eq('user_id',session.user.id)
   .then(({data,error})=>{
    if(!active)return;
    if(error)notify(error);
    const list=(data||[]).map(x=>x.aesthetic).filter(x=>OPTIONS.includes(x));
    setPreferences(list);setSelected(list);setPrefLoading(false);
   });
  return ()=>{active=false;};
 },[session?.user?.id]);

 useEffect(()=>{
  if(!session?.user?.id||preferences.length<3)return;
  let active=true;setFeedLoading(true);
  supabase.from('looks').select('id,caption,aesthetic,photo_path,published,look_items(item_name,description)').eq('published',true).limit(100)
   .then(({data,error})=>{
    if(!active)return;
    if(error){notify(error);setDbLooks([]);}
    else setDbLooks((data||[]).map(item=>{
      const photo=item.photo_path && supabase.storage.from('published-looks').getPublicUrl(item.photo_path).data.publicUrl;
      return {id:item.id,style:item.aesthetic,title:item.caption||'Inspiração MAD',photo,pieces:(item.look_items||[]).map(p=>p.description||p.item_name)};
    }));
    setFeedLoading(false);
   });
  return ()=>{active=false;};
 },[session?.user?.id,preferences.length]);

 useEffect(()=>{
  if(!session?.user?.id||!supabase){setSaved([]);return;}
  let active=true;
  setSavedLoading(true);
  supabase.from('saved_looks').select('look_id').eq('user_id',session.user.id)
   .then(({data,error})=>{
    if(!active)return;
    if(error){console.warn('Não foi possível carregar favoritos:',error.message);setSaved([]);}
    else setSaved((data||[]).map(row=>row.look_id));
    setSavedLoading(false);
   });
  return ()=>{active=false;};
 },[session?.user?.id]);

 async function authenticate(){
  if(!supabase)return Alert.alert('Configuração','Supabase indisponível.');
  if(!email.trim()||password.length<6)return Alert.alert('Confira seus dados','Digite seu e-mail e uma senha de pelo menos 6 caracteres.');
  setBusy(true);
  try{
   const {data,error}=authScreen==='register'
    ?await supabase.auth.signUp({email:email.trim(),password})
    :await supabase.auth.signInWithPassword({email:email.trim(),password});
   if(error)throw error;
   if(authScreen==='register'&&!data.session){
    Alert.alert('Confirme seu e-mail','Abra o e-mail enviado pelo MAD Closet, confirme sua conta e depois volte para Entrar.');
    setAuthScreen('login');
   }
  }catch(e){notify(e);}finally{setBusy(false);}
 }

 async function saveStyles(){
  if(selected.length<3||!session?.user?.id)return;
  setBusy(true);
  try{
   const id=session.user.id;
   const {error:remove}=await supabase.from('user_style_preferences').delete().eq('user_id',id);
   if(remove)throw remove;
   const {error:insert}=await supabase.from('user_style_preferences').insert(selected.map(aesthetic=>({user_id:id,aesthetic})));
   if(insert)throw insert;
   setPreferences([...selected]);setEditing(false);setTab('Início');
  }catch(e){notify(e);}finally{setBusy(false);}
 }
 const toggleStyle=name=>setSelected(old=>old.includes(name)?old.filter(x=>x!==name):[...old,name]);
 const catalog=dbLooks.length?dbLooks:samples;
 const visible=useMemo(()=>catalog.filter(x=>(category==='Todos'||x.style===category)&&(!query||((x.title||'')+' '+x.style+' '+(x.pieces||[]).join(' ')).toLowerCase().includes(query.toLowerCase()))).sort((a,b)=>Number(preferences.includes(b.style))-Number(preferences.includes(a.style))),[catalog,category,query,preferences]);
 async function toggleSaved(id){
  if(!supabase||!session?.user?.id)return;
  const wasSaved=saved.includes(id);
  setSaved(old=>wasSaved?old.filter(x=>x!==id):[...old,id]);
  const query=supabase.from('saved_looks');
  const {error}=wasSaved
   ?await query.delete().eq('user_id',session.user.id).eq('look_id',id)
   :await query.insert({user_id:session.user.id,look_id:id});
  if(error){
   setSaved(old=>wasSaved?[...new Set([...old,id])]:old.filter(x=>x!==id));
   notify(error);
  }
 }
 const card=item=><View key={item.id} style={s.card}>
  {item.photo?<Image source={{uri:item.photo}} style={s.photo} resizeMode="contain"/>:<View style={[s.photo,s.emptyPhoto]}><Text style={s.placeholder}>Fotografia do look completo\n{item.title}\n\nImagem ainda não cadastrada</Text></View>}
  <View style={s.cardBody}><Text style={s.kicker}>{(item.style||'ESTILO').toUpperCase()}</Text><Text style={s.cardTitle}>{item.title}</Text><Text style={s.smallTitle}>PEÇAS DO LOOK</Text>{(item.pieces||[]).map((piece,i)=><Text key={i} style={s.piece}>• {piece}</Text>)}
  <TouchableOpacity style={s.save} onPress={()=>toggleSaved(item.id)}><Text style={s.saveText}>{saved.includes(item.id)?'♥ Salvo':'♡ Salvar inspiração'}</Text></TouchableOpacity></View>
 </View>;

 if(boot||session&&prefLoading)return <SafeAreaView style={s.root}><ActivityIndicator style={{marginTop:100}} color={DARK}/></SafeAreaView>;
 if(!session)return <SafeAreaView style={s.root}><StatusBar barStyle="dark-content"/><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
  <ScrollView ref={authScroll} contentContainerStyle={[s.authWrap,authScreen!=="welcome"&&s.authWrapForm]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
   <View style={[s.cover,authScreen!=="welcome"&&s.coverCompact]}><Image source={COVER_IMAGE} resizeMode="cover" style={s.coverImage}/><View style={s.coverOverlay}><Text style={s.coverBrand}>MAD</Text><Text style={s.coverSub}>CLOSET</Text><Text style={s.slogan}>BE YOUR OWN MUSE.</Text></View></View>
   {authScreen==='welcome'?<View style={s.authButtons}><Action label="Entrar" onPress={()=>setAuthScreen('login')}/><Action label="Criar conta" outline onPress={()=>setAuthScreen('register')}/></View>:<View style={s.authPanel}>
    <Text style={s.heading}>{authScreen==='login'?'Entre na sua conta':'Crie sua conta'}</Text>
    <TextInput style={s.input} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="E-mail" onFocus={()=>authScroll.current?.scrollToEnd({animated:true})} value={email} onChangeText={setEmail}/>
    <TextInput style={s.input} secureTextEntry placeholder="Senha" onFocus={()=>authScroll.current?.scrollToEnd({animated:true})} value={password} onChangeText={setPassword}/>
    <Action label={busy?'Aguarde...':authScreen==='login'?'Entrar':'Cadastrar'} onPress={authenticate} disabled={busy}/>
    <TouchableOpacity style={s.textButton} onPress={()=>setAuthScreen(authScreen==='login'?'register':'login')}><Text style={s.link}>{authScreen==='login'?'Ainda não tenho conta':'Já tenho uma conta'}</Text></TouchableOpacity>
    <TouchableOpacity style={s.textButton} onPress={()=>setAuthScreen('welcome')}><Text style={s.link}>Voltar à capa</Text></TouchableOpacity>
   </View>}
  </ScrollView>
 </KeyboardAvoidingView></SafeAreaView>;

 if(preferences.length<3||editing)return <SafeAreaView style={s.root}><StatusBar barStyle="dark-content"/><ScrollView contentContainerStyle={s.page}>
  <Text style={s.brand}>MAD <Text style={{color:PINK}}>CLOSET</Text></Text><Text style={s.heading}>Escolha seus estilos</Text><Text style={s.description}>Selecione pelo menos 3 estilos para personalizar seu feed.</Text><Text style={s.counter}>{selected.length} selecionado(s) · mínimo 3</Text>
  <View style={s.styleGrid}>{OPTIONS.map(name=><TouchableOpacity key={name} onPress={()=>toggleStyle(name)} style={[s.styleOption,selected.includes(name)&&s.styleActive]}><Text style={[s.styleText,selected.includes(name)&&{color:'white'}]}>{selected.includes(name)?'✓  ':'+  '}{name}</Text></TouchableOpacity>)}</View>
  <Action label={busy?'Salvando...':'Continuar para o feed'} disabled={selected.length<3||busy} onPress={saveStyles}/>
  {editing&&<Action outline label="Cancelar" onPress={()=>{setSelected(preferences);setEditing(false);}}/>}
 </ScrollView></SafeAreaView>;

 return <SafeAreaView style={s.root}><StatusBar barStyle="dark-content"/><View style={s.top}><Text style={s.brand}>MAD <Text style={{color:PINK}}>CLOSET</Text></Text><Text style={s.sloganSmall}>BE YOUR OWN MUSE.</Text></View>
  <View style={{flex:1}}>
   {tab==='Início'||tab==='Pesquisar'?<ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
    <Text style={s.heading}>{tab==='Início'?'Seu feed, seu estilo':'Pesquisar looks'}</Text>
    {tab==='Pesquisar'&&<TextInput style={s.input} placeholder="Pesquise por estilo ou peça..." value={query} onChangeText={setQuery}/>}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0,marginVertical:16}}>{categories.map(c=><TouchableOpacity key={c} onPress={()=>setCategory(c)} style={[s.chip,category===c&&s.chipActive]}><Text style={[s.chipText,category===c&&{color:'white'}]}>{c}</Text></TouchableOpacity>)}</ScrollView>
    {feedLoading&&<ActivityIndicator color={DARK}/>}
    {dbLooks.length===0&&<Text style={s.hint}>Mostrando inspirações de exemplo enquanto as fotos reais são cadastradas.</Text>}
    {visible.length?visible.map(card):<Text style={s.description}>Nenhum look encontrado.</Text>}
   </ScrollView>:tab==='Salvos'?<ScrollView contentContainerStyle={s.page}><Text style={s.heading}>Meus salvos</Text><Text style={s.hint}>Seus favoritos ficam vinculados à sua conta MAD Closet.</Text>{savedLoading&&<ActivityIndicator color={DARK}/>}{catalog.filter(x=>saved.includes(x.id)).map(card)}{!saved.length&&<Text style={s.description}>Você ainda não salvou nenhum look.</Text>}</ScrollView>
   :tab==='Perfil'?<ScrollView contentContainerStyle={s.page}><Text style={s.heading}>Meu perfil</Text><Text style={s.description}>{session.user.email}</Text><Text style={s.smallTitle}>MEUS ESTILOS</Text><Text style={s.description}>{preferences.join(' · ')}</Text><Action label="Editar meus estilos" onPress={()=>{setSelected(preferences);setEditing(true);}}/><Action label="Sair da conta" outline onPress={()=>supabase.auth.signOut()}/></ScrollView>
   :<ScrollView contentContainerStyle={s.page}><Text style={s.heading}>Criar look +</Text><Text style={s.description}>Aqui você poderá fotografar ou escolher uma imagem, adicionar as peças e publicar seu look. A publicação ainda está em desenvolvimento.</Text><Action label="Voltar ao feed" onPress={()=>setTab('Início')}/></ScrollView>}
  </View>
  <View style={s.bottom}>{[['Início','⌂'],['Pesquisar','⌕'],['Criar look','+'],['Salvos','♡'],['Perfil','♙']].map(([name,symbol])=><TouchableOpacity key={name} accessibilityLabel={name} onPress={()=>{setTab(name);setQuery('');setCategory('Todos');}} style={s.navItem}><View style={[s.navIcon,name==='Criar look'&&s.plus,name===tab&&name!=='Criar look'&&s.navSelected]}><Text style={[s.navSymbol,name==='Criar look'&&{color:'white',fontSize:30}]}>{symbol}</Text></View><Text style={[s.navLabel,tab===name&&{color:DARK,fontWeight:'700'}]}>{name}</Text></TouchableOpacity>)}</View>
 </SafeAreaView>;
}
const s=StyleSheet.create({
 root:{flex:1,backgroundColor:'#FFFFFF'},authWrap:{flexGrow:1,padding:20,justifyContent:'center'},authWrapForm:{justifyContent:'flex-start',paddingTop:16,paddingBottom:120},coverCompact:{minHeight:160,paddingVertical:12},coverImage:{...StyleSheet.absoluteFillObject,width:'100%',height:'100%'},coverOverlay:{backgroundColor:'rgba(255,241,246,0.76)',paddingHorizontal:20,paddingVertical:18,borderRadius:18,alignItems:'center'},cover:{minHeight:360,backgroundColor:PALE,borderRadius:22,alignItems:'center',justifyContent:'center',padding:24,borderWidth:1,borderColor:'#F4D5E1'},coverBrand:{fontSize:72,fontWeight:'700',letterSpacing:11,color:DARK},coverSub:{fontSize:17,letterSpacing:10,color:DARK},slogan:{fontSize:12,letterSpacing:3,color:DARK,marginTop:24},coverNote:{fontSize:11,color:'#AA7A90',textAlign:'center',marginTop:38},authButtons:{marginTop:12},authPanel:{paddingTop:22},heading:{fontSize:26,color:DARK,fontWeight:'700',marginVertical:12},input:{backgroundColor:PALE,borderWidth:1,borderColor:'#F3D4E0',borderRadius:14,padding:15,marginBottom:12,fontSize:15},action:{backgroundColor:DARK,padding:16,borderRadius:14,alignItems:'center',marginTop:10},outline:{backgroundColor:'white',borderWidth:1,borderColor:DARK},actionText:{color:'white',fontWeight:'700',fontSize:15},textButton:{padding:12,alignItems:'center'},link:{color:DARK},brand:{fontSize:26,color:DARK,fontWeight:'800',letterSpacing:3},sloganSmall:{color:'#B77793',letterSpacing:2,fontSize:9,marginTop:2},top:{paddingHorizontal:20,paddingTop:10,paddingBottom:12,borderBottomWidth:1,borderBottomColor:'#F9E7EE'},page:{padding:20,paddingBottom:34},description:{color:'#896E7B',fontSize:14,lineHeight:21,marginBottom:16},counter:{color:DARK,fontWeight:'700',marginBottom:16},styleGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:20},styleOption:{padding:17,backgroundColor:PALE,borderRadius:16,minWidth:'46%',borderWidth:1,borderColor:'#F3D4E0'},styleActive:{backgroundColor:DARK,borderColor:DARK},styleText:{color:DARK,fontWeight:'600'},chip:{backgroundColor:PALE,paddingVertical:10,paddingHorizontal:16,borderRadius:24,marginRight:8},chipActive:{backgroundColor:DARK},chipText:{color:DARK,fontWeight:'600'},hint:{color:'#A0788B',fontSize:12,marginBottom:18,lineHeight:18},card:{borderRadius:20,backgroundColor:'white',borderWidth:1,borderColor:'#F8E3EB',overflow:'hidden',marginBottom:20},photo:{height:330,width:'100%',backgroundColor:PALE},emptyPhoto:{justifyContent:'center',alignItems:'center',padding:25},placeholder:{textAlign:'center',color:'#AB7890',lineHeight:24},cardBody:{padding:18},kicker:{color:'#B76D90',fontSize:11,letterSpacing:2,fontWeight:'700'},cardTitle:{fontSize:21,fontWeight:'700',color:DARK,marginTop:6,marginBottom:14},smallTitle:{fontSize:11,letterSpacing:1.5,fontWeight:'700',color:DARK,marginBottom:10},piece:{fontSize:14,color:'#745C69',marginBottom:7},save:{marginTop:12,borderRadius:12,borderWidth:1,borderColor:'#E8B4C8',padding:13,alignItems:'center'},saveText:{color:DARK,fontWeight:'700'},bottom:{flexDirection:'row',justifyContent:'space-around',alignItems:'center',backgroundColor:'white',borderTopWidth:1,borderTopColor:'#F3D4E0',paddingTop:10,paddingBottom:Platform.OS==='ios'?18:16,paddingHorizontal:4},navItem:{flex:1,alignItems:'center',justifyContent:'center',minHeight:55},navIcon:{width:39,height:34,alignItems:'center',justifyContent:'center',borderRadius:16},navSelected:{backgroundColor:PALE},plus:{width:51,height:51,borderRadius:26,backgroundColor:DARK,marginTop:-17},navSymbol:{fontSize:25,color:DARK},navLabel:{fontSize:10,color:'#946F81',marginTop:2,textAlign:'center'}
});
