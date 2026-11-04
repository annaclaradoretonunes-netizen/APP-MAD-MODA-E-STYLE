import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking, Modal,
  Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import type { Session } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';
import { C } from './src/theme';
import { isBackendReady, supabase } from './src/lib/supabase';
import type { Look, Tab } from './src/lib/types';
import { PRIVACY_TEXT, PRIVACY_VERSION, TERMS_TEXT, TERMS_VERSION } from './src/legal';

type AuthMode = 'welcome' | 'signin' | 'signup';
type PhotoAsset = ImagePicker.ImagePickerAsset | null;
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const demo: Look[] = [
  { id: 'demo-1', user_id: 'demo', caption: 'Inspiração: baby tee com jeans e acessórios retrô 💗', aesthetic: 'Y2K', photo_path: '', item_name: 'Baby tee + jeans', brand: null, price_brl: null, item_url: null, created_at: new Date().toISOString() },
  { id: 'demo-2', user_id: 'demo', caption: 'Um mood romântico com cardigan e saia ✨', aesthetic: 'Coquette', photo_path: '', item_name: 'Cardigan + saia', brand: null, price_brl: null, item_url: null, created_at: new Date().toISOString() },
  { id: 'demo-3', user_id: 'demo', caption: 'Street style com tênis e bolsa vintage.', aesthetic: 'Streetwear', photo_path: '', item_name: 'Tênis + bolsa', brand: null, price_brl: null, item_url: null, created_at: new Date().toISOString() }
];

function PinkButton({ label, onPress, outline = false, disabled = false }: { label: string; onPress: () => void; outline?: boolean; disabled?: boolean }) {
  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} activeOpacity={0.8}
      style={[s.button, outline ? s.buttonOutline : s.buttonHot, disabled && { opacity: 0.5 }]}>
      <Text style={[s.buttonText, outline && { color: C.hot }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function LookCard({ look, saved, onSave }: { look: Look; saved: boolean; onSave: () => void }) {
  const openLink = async () => {
    if (look.item_url && /^https:\/\/[^\s]+$/i.test(look.item_url)) {
      try { await Linking.openURL(look.item_url); }
      catch { Alert.alert('Não foi possível abrir o link'); }
    }
  };
  return (
    <View style={s.lookCard}>
      <View style={s.lookPicture}>
        {look.signed_url
          ? <Image source={{ uri: look.signed_url }} style={s.lookImage} resizeMode="cover" />
          : <View style={s.mockLook}><Ionicons name="shirt-outline" size={56} color={C.hot} /><Text style={s.mockText}>LOOK INSPO</Text></View>}
        <Text style={s.lookSticker}>{look.aesthetic.toUpperCase()}</Text>
      </View>
      <View style={s.lookCaptionRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.lookTitle}>{look.item_name || 'Meu look'}</Text>
          <Text style={s.lookSub}>{look.caption || 'Fashion diary 💕'}</Text>
        </View>
        <TouchableOpacity accessibilityLabel={saved ? 'Remover dos salvos' : 'Salvar look'} onPress={onSave} style={s.iconCircle}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} color={C.hot} size={25} />
        </TouchableOpacity>
      </View>
      {!!(look.brand || look.price_brl !== null || look.item_url) && (
        <View style={s.lookDetails}>
          {!!look.brand && <Text style={s.detailText}>Marca: {look.brand}</Text>}
          {look.price_brl !== null && <Text style={s.detailText}>{BRL.format(Number(look.price_brl))}</Text>}
          {!!look.item_url && <TouchableOpacity onPress={openLink}><Text style={s.link}>Ver loja ↗</Text></TouchableOpacity>}
        </View>
      )}
    </View>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(isBackendReady);
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [demoMode, setDemoMode] = useState(false);
  const [tab, setTab] = useState<Tab>('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null);
  const [busy, setBusy] = useState(false);
  const [looks, setLooks] = useState<Look[]>(demo);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [photo, setPhoto] = useState<PhotoAsset>(null);
  const [caption, setCaption] = useState('');
  const [aesthetic, setAesthetic] = useState('Y2K');
  const [itemName, setItemName] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  const [displayName, setDisplayName] = useState('MAD Lover');

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    client.auth.getSession().then(({ data }) => { setSession(data.session); setLoadingSession(false); }).catch(() => setLoadingSession(false));
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) { setDemoMode(false); setTab('home'); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    const client = supabase;
    if (!client || !session) return;
    const [lookResponse, saveResponse, profileResponse] = await Promise.all([
      client.from('looks').select('*').eq('published', true).order('created_at', { ascending: false }).limit(50),
      client.from('saved_looks').select('look_id').eq('user_id', session.user.id),
      client.from('profiles').select('display_name').eq('id', session.user.id).maybeSingle()
    ]);
    if (lookResponse.error) { Alert.alert('Erro no feed', lookResponse.error.message); return; }
    const rows = (lookResponse.data || []) as Look[];
    const signed = await Promise.all(rows.map(async (row) => {
      const { data } = await client.storage.from('looks').createSignedUrl(row.photo_path, 3600);
      return { ...row, signed_url: data?.signedUrl || null };
    }));
    setLooks(signed);
    setSavedIds((saveResponse.data || []).map((r: { look_id: string }) => r.look_id));
    if (profileResponse.data?.display_name) setDisplayName(profileResponse.data.display_name);
  }, [session]);

  useEffect(() => { refresh().catch(() => Alert.alert('Não foi possível atualizar o feed')); }, [refresh]);

  async function submitAuth() {
    const client = supabase;
    if (!client) { Alert.alert('Modo demonstração', 'Configure a URL e a chave pública do Supabase para criar contas reais.'); return; }
    if (!email.includes('@') || password.length < 6) { Alert.alert('Confira os dados', 'Use um e-mail válido e senha de pelo menos 6 caracteres.'); return; }
    if (mode === 'signup' && !accepted) { Alert.alert('Confirmação necessária', 'Leia e aceite os Termos de Uso e a Política de Privacidade.'); return; }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await client.auth.signUp({
          email: email.trim(), password,
          options: { data: { mad_accepted: true, terms_version: TERMS_VERSION, privacy_version: PRIVACY_VERSION } }
        });
        if (error) throw error;
        if (!data.session) { Alert.alert('Verifique seu e-mail', 'Se o cadastro foi recebido, siga o link de confirmação enviado para seu e-mail e depois toque em Entrar.'); setMode('signin'); }
      } else {
        const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (e) { Alert.alert('Não foi possível entrar', e instanceof Error ? e.message : 'Tente novamente.'); }
    finally { setBusy(false); }
  }

  async function choosePhoto(camera: boolean) {
    try {
      if (camera) {
        const p = await ImagePicker.requestCameraPermissionsAsync();
        if (!p.granted) { Alert.alert('Permissão necessária', 'Habilite o acesso à câmera nas configurações do celular.'); return; }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, quality: 0.7 };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) { Alert.alert('Foto muito grande', 'Escolha uma foto com até 5 MB.'); return; }
      setPhoto(asset);
    } catch { Alert.alert('Erro na foto', 'Não conseguimos abrir sua imagem.'); }
  }

  async function publish() {
    if (!photo) { Alert.alert('Escolha sua foto', 'Selecione uma imagem do look antes de publicar.'); return; }
    if (storeUrl.trim() && !/^https:\/\/[^\s]+$/i.test(storeUrl.trim())) {
      Alert.alert('Link inválido', 'Use um endereço de loja começando com https://'); return;
    }
    const value = price.trim() ? Number(price.replace(',', '.')) : null;
    if (value !== null && (!Number.isFinite(value) || value < 0)) { Alert.alert('Preço inválido', 'Informe um preço positivo, ou deixe em branco.'); return; }
    const basic = {
      caption: caption.trim().slice(0, 500), aesthetic: aesthetic.trim().slice(0, 40) || 'Y2K',
      item_name: itemName.trim().slice(0, 100) || null, brand: brand.trim().slice(0, 100) || null,
      price_brl: value, item_url: storeUrl.trim() || null
    };
    setBusy(true);
    try {
      const client = supabase;
      if (client && session) {
        const mime = photo.mimeType || 'image/jpeg';
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) throw new Error('Use uma foto JPG, PNG ou WEBP.');
        const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
        const path = `${session.user.id}/${Date.now()}-${Math.floor(Math.random() * 10000000)}.${extension}`;
        const bytes = await new File(photo.uri).arrayBuffer();
        if (bytes.byteLength > 5 * 1024 * 1024) throw new Error('A foto deve ter até 5 MB.');
        const uploaded = await client.storage.from('looks').upload(path, bytes, { contentType: mime, upsert: false });
        if (uploaded.error) throw uploaded.error;
        const inserted = await client.from('looks').insert({ user_id: session.user.id, photo_path: path, ...basic });
        if (inserted.error) {
          await client.storage.from('looks').remove([path]);
          throw inserted.error;
        }
        await refresh();
      } else {
        setLooks(old => [{
          id: `demo-${Date.now()}`, user_id: 'demo', photo_path: '', signed_url: photo.uri,
          created_at: new Date().toISOString(), ...basic
        }, ...old]);
        Alert.alert('Publicação de demonstração', 'Seu look aparece apenas neste dispositivo e não foi salvo na nuvem.');
      }
      setPhoto(null); setCaption(''); setItemName(''); setBrand(''); setPrice(''); setStoreUrl('');
      setTab('home');
    } catch (e) { Alert.alert('Erro ao publicar', e instanceof Error ? e.message : 'Tente novamente.'); }
    finally { setBusy(false); }
  }

  async function toggleSave(lookId: string) {
    const wasSaved = savedIds.includes(lookId);
    setSavedIds(prev => wasSaved ? prev.filter(id => id !== lookId) : [...prev, lookId]);
    const client = supabase;
    if (client && session) {
      const result = wasSaved
        ? await client.from('saved_looks').delete().eq('user_id', session.user.id).eq('look_id', lookId)
        : await client.from('saved_looks').insert({ user_id: session.user.id, look_id: lookId });
      if (result.error) { setSavedIds(prev => wasSaved ? [...prev, lookId] : prev.filter(id => id !== lookId)); Alert.alert('Erro ao salvar', result.error.message); }
    }
  }

  async function updateProfile() {
    if (!supabase || !session) return;
    const name = displayName.trim().slice(0, 60);
    if (!name) return Alert.alert('Digite um nome');
    const { error } = await supabase.from('profiles').update({ display_name: name }).eq('id', session.user.id);
    Alert.alert(error ? 'Erro ao atualizar' : 'Perfil atualizado', error?.message || 'Seu nome foi salvo.');
  }

  const filtered = useMemo(() => looks.filter(look => {
    const matchesType = filter === 'Todos' || look.aesthetic.toLowerCase() === filter.toLowerCase();
    const matchesQuery = [look.caption, look.item_name, look.brand, look.aesthetic].join(' ').toLowerCase().includes(query.toLowerCase().trim());
    return matchesType && matchesQuery;
  }), [looks, query, filter]);

  function renderCards(items: Look[]) {
    if (!items.length) return <View style={s.empty}><Ionicons name="sparkles-outline" size={40} color={C.hot} /><Text style={s.emptyText}>Nenhum look por aqui ainda. Seja a primeira pessoa a publicar! 💗</Text></View>;
    return items.map(look => <LookCard key={look.id} look={look} saved={savedIds.includes(look.id)} onSave={() => toggleSave(look.id)} />);
  }

  if (loadingSession) return <SafeAreaView style={[s.root, s.center]}><ActivityIndicator size="large" color={C.hot} /></SafeAreaView>;

  const loggedIn = Boolean(session || demoMode);
  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />
      <Modal visible={legal !== null} animationType="slide" onRequestClose={() => setLegal(null)}>
        <SafeAreaView style={s.root}>
          <View style={s.legalHeader}>
            <Text style={s.sectionTitle}>{legal === 'terms' ? 'Termos de Uso' : 'Privacidade'}</Text>
            <TouchableOpacity onPress={() => setLegal(null)}><Ionicons name="close-circle" size={30} color={C.hot} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24 }}>
            <Text style={s.legalText}>{legal === 'terms' ? TERMS_TEXT : PRIVACY_TEXT}</Text>
          </ScrollView>
          <View style={{ padding: 22 }}><PinkButton label="Voltar" onPress={() => setLegal(null)} /></View>
        </SafeAreaView>
      </Modal>

      {!loggedIn ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.auth} keyboardShouldPersistTaps="handled">
            <View style={s.sparkles}><Ionicons name="sparkles" size={26} color={C.hot} /><Text style={s.sparkleText}>est. 2000 ✩</Text></View>
            <Text style={s.bigLogo}>MAD<Text style={{ color: C.ink }}>✦</Text></Text>
            <Text style={s.authTag}>your look. your mood. your era.</Text>
            <View style={s.heroBox}>
              <Ionicons name="heart" size={34} color={C.hot} />
              <Text style={s.heroTitle}>WELCOME TO YOUR FASHION ERA</Text>
              <Text style={s.heroSub}>Crie, compartilhe e descubra looks. Tudo com energia Y2K!</Text>
              <Text style={s.heroStar}>✦ ♡ ✦</Text>
            </View>
            {mode === 'welcome' ? (
              <View style={s.form}>
                <PinkButton label="CRIAR CONTA ♡" onPress={() => setMode('signup')} />
                <PinkButton label="JÁ TENHO CONTA" outline onPress={() => setMode('signin')} />
                <TouchableOpacity onPress={() => { setDemoMode(true); setTab('home'); }}>
                  <Text style={s.centerLink}>Ver modo demonstração →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.form}>
                <Text style={s.formTitle}>{mode === 'signup' ? 'JOIN THE MAD CLUB 💌' : 'WELCOME BACK 💗'}</Text>
                <TextInput style={s.input} placeholder="Seu e-mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
                <TextInput style={s.input} placeholder="Sua senha (mín. 6 caracteres)" secureTextEntry value={password} onChangeText={setPassword} />
                {mode === 'signup' && (
                  <View style={s.termsWrap}>
                    <TouchableOpacity onPress={() => setAccepted(!accepted)} accessibilityRole="checkbox" accessibilityState={{ checked: accepted }}>
                      <Ionicons name={accepted ? 'checkbox' : 'square-outline'} color={C.hot} size={25} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <Text style={s.termsText}>Li e aceito os textos abaixo:</Text>
                      <TouchableOpacity onPress={() => setLegal('terms')}><Text style={s.link}>Termos de Uso (rascunho)</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => setLegal('privacy')}><Text style={s.link}>Política de Privacidade (rascunho)</Text></TouchableOpacity>
                    </View>
                  </View>
                )}
                <PinkButton disabled={busy} label={busy ? 'PROCESSANDO...' : mode === 'signup' ? 'CRIAR MINHA CONTA' : 'ENTRAR'} onPress={submitAuth} />
                <TouchableOpacity onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}><Text style={s.centerLink}>{mode === 'signup' ? 'Já tem conta? Entrar' : 'Ainda não tem conta? Cadastre-se'}</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setMode('welcome')}><Text style={s.centerLink}>← Voltar</Text></TouchableOpacity>
              </View>
            )}
            {!isBackendReady && <Text style={s.warning}>Demonstração: Supabase ainda não configurado. Cadastro e login reais ficam indisponíveis até a conexão.</Text>}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <>
          <View style={s.topBar}>
            <Text style={s.logoSmall}>MAD<Text style={{ color: C.ink }}>✦</Text></Text>
            <View style={s.topTag}><Ionicons name="sparkles" size={15} color={C.hot} /><Text style={s.topTagText}>FASHION CLUB</Text></View>
          </View>
          <ScrollView key={tab} contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
            {demoMode && <Text style={s.demoBanner}>MODO DEMONSTRAÇÃO · Fotos e favoritos não ficam salvos na nuvem.</Text>}
            {tab === 'home' && (
              <>
                <View style={s.highlight}><Text style={s.highlightMini}>YOUR DAILY DOSE OF STYLE</Text><Text style={s.highlightTitle}>It's a MAD world! ♡</Text><Text style={s.highlightSub}>Explore tendências, inspire-se e compartilhe seu estilo.</Text></View>
                <View style={s.sectionRow}><Text style={s.sectionTitle}>Fashion Feed ✨</Text><TouchableOpacity onPress={() => { setTab('explore'); }}><Text style={s.link}>Explorar →</Text></TouchableOpacity></View>
                {renderCards(looks)}
              </>
            )}
            {tab === 'explore' && (
              <>
                <Text style={s.sectionTitle}>Explore looks 🔎</Text>
                <TextInput style={s.input} placeholder="Buscar peça, marca ou estilo..." value={query} onChangeText={setQuery} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
                  {['Todos', 'Y2K', 'Coquette', 'Streetwear', 'Vintage', 'Casual'].map(x => (
                    <TouchableOpacity key={x} onPress={() => setFilter(x)} style={[s.chip, filter === x && s.chipOn]}><Text style={[s.chipText, filter === x && { color: C.white }]}>{x}</Text></TouchableOpacity>
                  ))}
                </ScrollView>
                {renderCards(filtered)}
              </>
            )}
            {tab === 'post' && (
              <>
                <Text style={s.sectionTitle}>Post your look 📸</Text>
                <Text style={s.subtitle}>Sua passarela começa aqui!</Text>
                <TouchableOpacity style={s.photoPicker} onPress={() => choosePhoto(false)}>
                  {photo ? <Image source={{ uri: photo.uri }} style={s.previewImage} /> : <><Ionicons name="images-outline" size={48} color={C.hot} /><Text style={s.pickerText}>TOQUE PARA ESCOLHER UMA FOTO</Text></>}
                </TouchableOpacity>
                <View style={s.doubleButtons}><View style={{ flex: 1 }}><PinkButton outline label="GALERIA" onPress={() => choosePhoto(false)} /></View><View style={{ flex: 1 }}><PinkButton outline label="CÂMERA" onPress={() => choosePhoto(true)} /></View></View>
                <TextInput style={[s.input, { minHeight: 90, textAlignVertical: 'top' }]} placeholder="Conte sobre seu look..." value={caption} onChangeText={setCaption} multiline maxLength={500} />
                <Text style={s.fieldLabel}>Estilo</Text>
                <TextInput style={s.input} placeholder="Y2K, coquette, streetwear..." value={aesthetic} onChangeText={setAesthetic} maxLength={40} />
                <Text style={s.fieldLabel}>Detalhes das peças (opcional)</Text>
                <TextInput style={s.input} placeholder="Nome da peça / combinação" value={itemName} onChangeText={setItemName} maxLength={100} />
                <TextInput style={s.input} placeholder="Marca" value={brand} onChangeText={setBrand} maxLength={100} />
                <TextInput style={s.input} placeholder="Preço em R$ (informado pelo usuário)" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
                <TextInput style={s.input} placeholder="Link https:// para a loja (opcional)" autoCapitalize="none" value={storeUrl} onChangeText={setStoreUrl} />
                <PinkButton disabled={busy} label={busy ? 'PUBLICANDO...' : 'PUBLICAR LOOK 💗'} onPress={publish} />
                <Text style={s.footnote}>Publique fotos suas ou com autorização. Evite imagens com endereços, documentos e dados pessoais.</Text>
              </>
            )}
            {tab === 'saved' && (
              <><Text style={s.sectionTitle}>My favorites ♡</Text><Text style={s.subtitle}>Looks para você se inspirar depois.</Text>{renderCards(looks.filter(l => savedIds.includes(l.id)))}</>
            )}
            {tab === 'profile' && (
              <>
                <View style={s.profileCard}><View style={s.avatar}><Ionicons name="person" color={C.hot} size={46} /></View><Text style={s.profileTitle}>{displayName}</Text><Text style={s.subtitle}>{session?.user.email || 'Conta demonstração'}</Text><Text style={s.profileMini}>☆ MADE FOR FASHION LOVERS ☆</Text></View>
                {session && <><Text style={s.fieldLabel}>Seu nome no MAD</Text><TextInput style={s.input} value={displayName} onChangeText={setDisplayName} maxLength={60} /><PinkButton outline label="SALVAR NOME" onPress={updateProfile} /></>}
                <Text style={s.sectionTitle}>My looks</Text>
                {renderCards(looks.filter(l => l.user_id === (session?.user.id || 'demo') && (l.id.startsWith('demo-') ? !!l.signed_url : true)))}
                <PinkButton outline label="SAIR DA CONTA" onPress={() => { if (session) supabase?.auth.signOut(); else { setDemoMode(false); setTab('home'); } }} />
                <Text style={s.footnote}>Versão 1.0 de testes · Políticas provisórias · Não publicar ao público antes da revisão de segurança e privacidade.</Text>
              </>
            )}
          </ScrollView>
          <View style={s.tabBar}>
            {([
              ['home', 'home-outline', 'Início'],
              ['explore', 'search-outline', 'Explorar'],
              ['post', 'add-circle-outline', 'Postar'],
              ['saved', 'heart-outline', 'Salvos'],
              ['profile', 'person-outline', 'Perfil']
            ] as [Tab, keyof typeof Ionicons.glyphMap, string][]).map(([id, icon, label]) => (
              <TouchableOpacity key={id} onPress={() => setTab(id)} style={s.tab} accessibilityRole="tab" accessibilityState={{ selected: tab === id }}>
                <Ionicons name={icon} size={tab === id ? 28 : 24} color={tab === id ? C.hot : C.muted} />
                <Text style={[s.tabText, tab === id && { color: C.hot, fontWeight: '800' }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.blush },
  center: { alignItems: 'center', justifyContent: 'center' },
  auth: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 23, paddingTop: 28, paddingBottom: 35 },
  sparkles: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 8 },
  sparkleText: { color: C.hot, fontWeight: '800', fontSize: 12, letterSpacing: 2 },
  bigLogo: { color: C.hot, fontSize: 84, lineHeight: 106, fontWeight: '900', letterSpacing: -6 },
  authTag: { fontSize: 13, fontWeight: '800', color: C.ink, letterSpacing: 1, marginTop: -4, marginBottom: 24 },
  heroBox: { backgroundColor: C.white, borderWidth: 2, borderColor: C.hot, borderRadius: 30, padding: 24, width: '100%', alignItems: 'center', shadowColor: C.hot, shadowOpacity: 0.17, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: C.hot, textAlign: 'center', marginTop: 12 },
  heroSub: { fontSize: 14, lineHeight: 22, color: C.ink, textAlign: 'center', marginTop: 7 },
  heroStar: { color: C.hot, fontSize: 22, marginTop: 11 },
  form: { width: '100%', gap: 12, marginTop: 24 },
  formTitle: { fontWeight: '900', fontSize: 21, textAlign: 'center', color: C.hot, marginBottom: 4 },
  button: { minHeight: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, borderWidth: 2, borderColor: C.hot },
  buttonHot: { backgroundColor: C.hot },
  buttonOutline: { backgroundColor: C.white },
  buttonText: { color: C.white, fontWeight: '900', fontSize: 14, letterSpacing: 0.8, textAlign: 'center' },
  input: { backgroundColor: C.white, borderWidth: 1.4, borderColor: C.border, borderRadius: 15, paddingHorizontal: 15, minHeight: 52, fontSize: 15, color: C.ink, marginBottom: 10 },
  centerLink: { color: C.darkPink, fontWeight: '700', textAlign: 'center', marginTop: 9, marginBottom: 8 },
  termsWrap: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 10 },
  termsText: { color: C.ink, marginBottom: 4 },
  link: { color: C.darkPink, textDecorationLine: 'underline', fontWeight: '800', fontSize: 13, marginVertical: 2 },
  warning: { color: C.darkPink, textAlign: 'center', fontSize: 12, marginTop: 20 },
  legalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  legalText: { fontSize: 15, color: C.ink, lineHeight: 26 },
  topBar: { backgroundColor: C.white, paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border },
  logoSmall: { color: C.hot, fontSize: 32, fontWeight: '900', letterSpacing: -2 },
  topTag: { backgroundColor: C.pastel, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5 },
  topTagText: { color: C.hot, fontSize: 10, letterSpacing: 1, fontWeight: '900' },
  page: { padding: 18, paddingBottom: 30, gap: 10 },
  demoBanner: { color: C.darkPink, fontSize: 12, padding: 12, backgroundColor: C.pastel, borderRadius: 10 },
  highlight: { backgroundColor: C.hot, borderRadius: 23, padding: 24, marginBottom: 12 },
  highlightMini: { color: C.white, fontSize: 11, fontWeight: '900', letterSpacing: 1.6 },
  highlightTitle: { color: C.white, fontSize: 32, fontWeight: '900', marginVertical: 6 },
  highlightSub: { color: C.white, fontSize: 14, lineHeight: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  sectionTitle: { color: C.ink, fontSize: 24, fontWeight: '900', marginTop: 4, marginBottom: 8 },
  subtitle: { color: C.muted, fontSize: 14, marginBottom: 12 },
  lookCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 24, overflow: 'hidden', marginBottom: 15 },
  lookPicture: { height: 260, backgroundColor: C.pastel },
  lookImage: { width: '100%', height: '100%' },
  mockLook: { height: '100%', justifyContent: 'center', alignItems: 'center', gap: 10, backgroundColor: C.pastel },
  mockText: { color: C.darkPink, fontWeight: '900', fontSize: 17, letterSpacing: 3 },
  lookSticker: { position: 'absolute', left: 12, top: 12, backgroundColor: C.white, color: C.hot, overflow: 'hidden', padding: 9, borderRadius: 15, fontWeight: '900', fontSize: 11 },
  lookCaptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, gap: 8 },
  lookTitle: { color: C.ink, fontSize: 17, fontWeight: '900', marginBottom: 4 },
  lookSub: { color: C.muted, fontSize: 13, lineHeight: 18 },
  iconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.blush, alignItems: 'center', justifyContent: 'center' },
  lookDetails: { borderTopColor: C.border, borderTopWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', paddingHorizontal: 15, paddingBottom: 15, paddingTop: 10 },
  detailText: { color: C.ink, fontWeight: '700', fontSize: 12 },
  empty: { minHeight: 180, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', padding: 24, borderRadius: 24 },
  emptyText: { textAlign: 'center', color: C.muted, marginTop: 12 },
  chip: { borderWidth: 1, borderColor: C.border, backgroundColor: C.white, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20 },
  chipOn: { backgroundColor: C.hot, borderColor: C.hot },
  chipText: { color: C.darkPink, fontWeight: '800' },
  photoPicker: { minHeight: 230, borderColor: C.hot, backgroundColor: C.pastel, borderRadius: 22, borderWidth: 2, borderStyle: 'dashed', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 10 },
  pickerText: { color: C.darkPink, fontWeight: '900', textAlign: 'center' },
  previewImage: { width: '100%', height: 230 },
  doubleButtons: { flexDirection: 'row', gap: 10, marginVertical: 10 },
  fieldLabel: { color: C.ink, fontWeight: '800', marginTop: 8 },
  footnote: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 15, textAlign: 'center' },
  profileCard: { backgroundColor: C.white, borderRadius: 25, borderWidth: 1, borderColor: C.border, alignItems: 'center', padding: 26, marginBottom: 20 },
  avatar: { backgroundColor: C.pastel, width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  profileTitle: { fontSize: 24, fontWeight: '900', color: C.hot },
  profileMini: { fontSize: 11, color: C.darkPink, fontWeight: '900', marginTop: 6, letterSpacing: 1 },
  tabBar: { flexDirection: 'row', backgroundColor: C.white, borderTopColor: C.border, borderTopWidth: 1, paddingVertical: 9, paddingBottom: Platform.OS === 'ios' ? 15 : 10 },
  tab: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 3 },
  tabText: { fontSize: 10, fontWeight: '600', color: C.muted }
});
