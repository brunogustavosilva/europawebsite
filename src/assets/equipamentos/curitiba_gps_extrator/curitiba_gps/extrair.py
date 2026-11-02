import requests,json,csv,time
from pathlib import Path
P=Path(__file__).parent
ENDPOINTS=['https://overpass.kumi.systems/api/interpreter','https://overpass-api.de/api/interpreter']
Q='''[out:json][timeout:180];area["name"="Curitiba"]["boundary"="administrative"]->.a;(way["highway"="busway"](area.a);way["service"="busway"](area.a);way["name"~"canaleta|BRT",i](area.a););out body geom;'''
R='''[out:json][timeout:180];area["name"="Curitiba"]["boundary"="administrative"]->.a;way["highway"]["name"](area.a);out body geom;'''
def get(q):
 for url in ENDPOINTS:
  try:
   r=requests.post(url,data={'data':q},timeout=210);r.raise_for_status();return r.json()['elements']
  except Exception as e: print('Falhou',url,str(e)[:100]);time.sleep(2)
 raise RuntimeError('Overpass indisponível. Tente novamente mais tarde.')
def coords(e):return [(p['lon'],p['lat']) for p in e.get('geometry',[])]
def main():
 from shapely.geometry import LineString,mapping
 from shapely.strtree import STRtree
 b=get(Q);r=get(R)
 features=[];bl=[]
 for x in b:
  if len(coords(x))<2:continue
  g=LineString(coords(x));bl.append((x,g));features.append({'type':'Feature','geometry':mapping(g),'properties':{'osm_id':x['id'],**x.get('tags',{}),'validado':False}})
 (P/'canaletas_curitiba.geojson').write_text(json.dumps({'type':'FeatureCollection','features':features},ensure_ascii=False))
 roads=[(x,LineString(coords(x))) for x in r if len(coords(x))>=2]
 geoms=[g for _,g in roads];tree=STRtree(geoms)
 rows=[];seen=set()
 for bx,bg in bl:
  for i in tree.query(bg):
   rx,rg=roads[int(i)]
   if bx['id']==rx['id'] or not bg.intersects(rg):continue
   intersection=bg.intersection(rg)
   pts=[intersection] if intersection.geom_type=='Point' else list(intersection.geoms) if intersection.geom_type=='MultiPoint' else []
   for pt in pts:
    key=(bx['id'],rx['id'],round(pt.x,7),round(pt.y,7))
    if key in seen:continue
    seen.add(key)
    rows.append({'canaleta_osm_id':bx['id'],'canaleta_nome':bx.get('tags',{}).get('name',''),'rua_osm_id':rx['id'],'rua_nome':rx.get('tags',{}).get('name',''),'latitude':pt.y,'longitude':pt.x,'acesso_confirmado':False,'cruzamento_em_nivel_confirmado':False})
 with (P/'cruzamentos_canaletas_curitiba.csv').open('w',newline='',encoding='utf-8-sig') as f:
  w=csv.DictWriter(f,fieldnames=['canaleta_osm_id','canaleta_nome','rua_osm_id','rua_nome','latitude','longitude','acesso_confirmado','cruzamento_em_nivel_confirmado']);w.writeheader();w.writerows(rows)
 network={'status':'NAO_VALIDADO','trechos_candidatos':len(features),'cruzamentos_geometricos_candidatos':len(rows),'permitir_roteamento_automatico':False,'observacao':'Verificar conectividade, sentidos, restricoes e permissoes legais antes de usar em emergencia'}
 (P/'rede_emergencia_curitiba.json').write_text(json.dumps(network,ensure_ascii=False,indent=2))
 print(network)
if __name__=='__main__':main()
