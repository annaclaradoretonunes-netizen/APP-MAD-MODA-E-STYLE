import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {styles as categories, looks} from './src/looks';
import {supabase} from './src/supabase';

const OPTIONS = categories.filter(x => x !== 'Todos');
const message = error => Alert.alert('MAD Closet', error?.message || 'Não foi possível concluir. Tente novamente.');

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [mode, setMode] = useState('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selected, setSelected] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [onboarded, setOnboarded] = useState(false);
  const [category, setCategory] = useState('Todos');
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({data, error}) => {
      if (error) message(error);
      setSession(data?.session || null);
      setLoading(false);
    });
    const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id || !supabase) {
      setOnboarded(false); setPreferences([]); setSelected([]);
      return;
    }
    let active = true;
    setChecking(true);
    supabase.from('user_style_preferences').select('aesthetic').eq('user_id', session.user.id)
      .then(({data, error}) => {
        if (!active) return;
        if (error) message(error);
        const list = (data || []).map(row => row.aesthetic).filter(x => OPTIONS.includes(x));
        setPreferences(list); setSelected(list); setOnboarded(list.length >= 3);
        setChecking(false);
      });
    return () => { active = false; };
  }, [session?.user?.id]);

  const visible = useMemo(() => {
    const filtered = looks.filter(x => category === 'Todos' || x.style === category);
    return [...filtered].sort((a,b) => Number(preferences.includes(b.style)) - Number(preferences.includes(a.style)));
  }, [category, preferences]);

  async function authenticate() {
    if (!supabase) return Alert.alert('Configuração', 'Configure o Supabase no app.json.');
    if (!email.trim() || password.length < 6) return Alert.alert('Verifique seus dados', 'Informe um e-mail e senha com pelo menos 6 caracteres.');
    setChecking(true);
    try {
      const result = mode === 'register'
        ? await supabase.auth.signUp({email: email.trim(), password})
        : await supabase.auth.signInWithPassword({email: email.trim(), password});
      if (result.error) throw result.error;
      if (mode === 'register' && !result.data.session) {
        Alert.alert('Confirme seu e-mail', 'Confira sua caixa de entrada e confirme o cadastro. Depois, entre com sua conta.');
        setMode('login');
      }
    } catch (error) { message(error); }
    finally { setChecking(false); }
  }

  async function savePreferences() {
    if (selected.length < 3 || !session?.user?.id) return;
    setChecking(true);
    try {
      const userId = session.user.id;
      const {error: removeError} = await supabase.from('user_style_preferences').delete().eq('user_id', userId);
      if (removeError) throw removeError;
      const {error} = await supabase.from('user_style_preferences').insert(selected.map(aesthetic => ({user_id: userId, aesthetic})));
      if (error) throw error;
      setPreferences(selected); setOnboarded(true); setCategory('Todos');
    } catch (error) { message(error); }
    finally { setChecking(false); }
  }

  const toggleStyle = name => setSelected(current => current.includes(name) ? current.filter(x => x !== name) : [...current, name]);
  const toggleSaved = id => {
    if (!session) return Alert.alert('Entre na sua conta', 'Crie uma conta ou faça login para salvar inspirações.');
    setSaved(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  };

  if (loading || (session && checking && !onboarded && !selected.length)) return <SafeAreaView style={s.screen}><ActivityIndicator style={{marginTop:90}} color="#61493E"/></SafeAreaView>;

  return <SafeAreaView style={s.screen}>
    <StatusBar barStyle="dark-content"/>
    <View style={s.header}><Text style={s.brand}>MAD</Text><Text style={s.sub}>CLOSET · SEU ESTILO, SUAS ESCOLHAS</Text></View>
    {session && !onboarded ? <ScrollView contentContainerStyle={s.content}>
      <Text style={s.heading}>Qual é o seu estilo?</Text>
      <Text style={s.intro}>Escolha pelo menos 3 estilos. Vamos usar suas escolhas para organizar seu feed.</Text>
      <Text style={s.counter}>{selected.length} selecionado(s) · mínimo de 3</Text>
      <View style={s.optionGrid}>{OPTIONS.map(name => <TouchableOpacity key={name} accessibilityRole="checkbox" accessibilityState={{checked:selected.includes(name)}} onPress={() => toggleStyle(name)} style={[s.option, selected.includes(name) && s.optionSelected]}><Text style={[s.optionText,selected.includes(name)&&s.optionTextSelected]}>{selected.includes(name) ? '✓  ' : '+  '}{name}</Text></TouchableOpacity>)}</View>
      <TouchableOpacity disabled={selected.length < 3 || checking} onPress={savePreferences} style={[s.primary, (selected.length < 3 || checking) && s.disabled]}><Text style={s.primaryText}>{checking ? 'Salvando...' : 'Criar meu feed'}</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => supabase.auth.signOut()} style={s.secondary}><Text>Sair da conta</Text></TouchableOpacity>
    </ScrollView> : <ScrollView contentContainerStyle={s.content}>
      {!session ? <View style={s.authBox}>
        <Text style={s.authTitle}>{mode === 'register' ? 'Crie seu perfil' : 'Entre no MAD Closet'}</Text>
        <Text style={s.intro}>Explore as inspirações sem login ou crie uma conta para escolher seus estilos.</Text>
        <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Seu e-mail" value={email} onChangeText={setEmail} style={s.input}/>
        <TextInput placeholder="Sua senha" secureTextEntry value={password} onChangeText={setPassword} style={s.input}/>
        <TouchableOpacity disabled={checking} style={s.primary} onPress={authenticate}><Text style={s.primaryText}>{checking ? 'Aguarde...' : mode === 'register' ? 'Cadastrar' : 'Entrar'}</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setMode(mode === 'register' ? 'login' : 'register')} style={s.secondary}><Text>{mode === 'register' ? 'Já tenho conta' : 'Criar uma conta'}</Text></TouchableOpacity>
      </View> : <View style={s.profileRow}><Text style={s.welcome}>Seu feed personalizado</Text><TouchableOpacity onPress={() => {setSelected(preferences); setOnboarded(false);}}><Text style={s.link}>Editar estilos</Text></TouchableOpacity><TouchableOpacity onPress={() => supabase.auth.signOut()}><Text style={s.link}>Sair</Text></TouchableOpacity></View>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters}>{categories.map(c => <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[s.chip, c === category && s.active]}><Text style={[s.chipText, c === category && s.activeText]}>{c}</Text></TouchableOpacity>)}</ScrollView>
      <Text style={s.heading}>{category === 'Todos' ? 'Descubra seu estilo' : category}</Text>
      <Text style={s.intro}>{session ? 'Looks dos seus estilos favoritos aparecem primeiro.' : 'Explore looks e descubra suas inspirações.'}</Text>
      {visible.map(item => <View key={item.id} style={s.card}>
        <View style={s.photo}><Text style={s.photoText}>Fotografia original do look\n{item.title}\n\nAguardando inclusão das imagens</Text></View>
        <View style={s.cardBody}><Text style={s.style}>{item.style.toUpperCase()}</Text><Text style={s.title}>{item.title}</Text><Text style={s.label}>PEÇAS DO LOOK</Text>{item.pieces.map((piece,i) => <Text key={i} style={s.piece}>• {piece}</Text>)}
        <TouchableOpacity onPress={() => toggleSaved(item.id)} style={s.save}><Text style={s.saveText}>{saved.includes(item.id) ? '♥ Salvo nesta sessão' : '♡ Salvar inspiração'}</Text></TouchableOpacity></View>
      </View>)}
    </ScrollView>}
  </SafeAreaView>;
}
const s = StyleSheet.create({
 screen:{flex:1,backgroundColor:'#F8F5F0'},header:{paddingTop:14,paddingBottom:12,alignItems:'center'},brand:{fontSize:35,fontWeight:'700',letterSpacing:8,color:'#382B2A'},sub:{fontSize:9,letterSpacing:3,color:'#806F68'},
 content:{padding:18,paddingBottom:65},heading:{fontSize:26,fontWeight:'600',color:'#332721',marginTop:12},intro:{fontSize:13,color:'#786960',marginTop:8,marginBottom:18,lineHeight:20},counter:{color:'#806F68',marginBottom:15},
 optionGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},option:{borderWidth:1,borderColor:'#D7C8BA',borderRadius:14,padding:16,backgroundColor:'white',minWidth:'45%'},optionSelected:{backgroundColor:'#44352F',borderColor:'#44352F'},optionText:{color:'#44352F',fontWeight:'600'},optionTextSelected:{color:'white'},
 primary:{backgroundColor:'#44352F',padding:15,borderRadius:12,alignItems:'center',marginTop:18},disabled:{opacity:.45},primaryText:{color:'white',fontWeight:'700'},secondary:{padding:14,alignItems:'center'},input:{backgroundColor:'white',borderWidth:1,borderColor:'#D7C8BA',borderRadius:12,padding:13,marginTop:10},
 authBox:{backgroundColor:'#F1EAE2',padding:17,borderRadius:16,marginBottom:20},authTitle:{fontSize:21,fontWeight:'600',color:'#332721'},profileRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:12},welcome:{fontWeight:'700',color:'#44352F'},link:{color:'#8C6259',fontSize:12},
 filters:{flexGrow:0,marginBottom:12},chip:{paddingHorizontal:15,paddingVertical:10,borderRadius:20,backgroundColor:'#EAE2D9',marginRight:8},active:{backgroundColor:'#44352F'},chipText:{fontSize:12,color:'#4A3933'},activeText:{color:'white'},
 card:{backgroundColor:'white',borderRadius:18,overflow:'hidden',marginBottom:24},photo:{height:280,backgroundColor:'#E5DBD0',justifyContent:'center',alignItems:'center',padding:30},photoText:{textAlign:'center',color:'#76685D',lineHeight:24},cardBody:{padding:18},style:{fontSize:10,letterSpacing:2,color:'#9A766B'},title:{fontSize:21,fontWeight:'600',marginTop:5,marginBottom:16,color:'#332721'},label:{fontSize:11,letterSpacing:1.5,fontWeight:'700',marginBottom:8,color:'#6C564C'},piece:{fontSize:14,color:'#554943',marginBottom:7},save:{marginTop:12,borderWidth:1,borderColor:'#C9B9AB',padding:12,borderRadius:12,alignItems:'center'},saveText:{color:'#6E4F49',fontWeight:'600'}
});
