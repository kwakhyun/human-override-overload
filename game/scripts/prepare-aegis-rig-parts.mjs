// Technical material separation from the approved pixels. Source-space masks
// are hand placed; this creates an editable work file, not a finished rig.
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url),sharp=require('sharp');
const {writePsdBuffer}=require('../reference/source-assets/overload/live2d-production/tools/node_modules/ag-psd');
const output=path.resolve('reference/source-assets/overload/live2d-production/aegis/parts-v1');
await mkdir(output,{recursive:true});
const width=864,height=1536;
const original=await sharp('public/assets/overload/hero/survivor-portrait-v2.webp').ensureAlpha().raw().toBuffer();
// Priority is front to back. Names describe screen sides, not anatomical sides.
const regions=[
 ['Eye_ScreenL','Face',[[417,235],[434,237],[458,242],[478,253],[475,265],[456,270],[436,262],[423,253]]],
 ['Eye_ScreenR','Face',[[497,255],[512,256],[536,261],[544,271],[539,282],[526,287],[510,280],[498,269]]],
 ['Brow_ScreenL','Face',[[418,219],[436,222],[461,230],[476,239],[474,244],[448,234],[423,228]]],
 ['Brow_ScreenR','Face',[[505,244],[523,245],[544,250],[547,255],[526,254],[507,250]]],
 ['Mouth','Face',[[455,309],[472,313],[491,316],[507,322],[500,331],[484,337],[467,329],[456,320]]],
 ['Hand_ScreenL','Arm_ScreenL',[[139,1196],[180,1200],[210,1223],[235,1270],[247,1324],[239,1380],[248,1411],[220,1443],[153,1435],[119,1385],[119,1328],[131,1264]]],
 ['Cuff_ScreenL','Arm_ScreenL',[[154,1082],[208,1094],[228,1110],[218,1167],[209,1201],[185,1218],[131,1190],[143,1131]]],
 ['Forearm_ScreenL','Arm_ScreenL',[[207,789],[274,807],[250,873],[228,965],[213,1086],[220,1108],[153,1091],[151,1036],[164,940],[182,858]]],
 ['UpperArm_ScreenL','Arm_ScreenL',[[219,445],[246,433],[288,442],[328,468],[344,528],[329,592],[309,649],[294,720],[275,811],[205,795],[207,713],[208,628],[198,541],[204,479]]],
 ['Hand_ScreenR','Arm_ScreenR',[[748,1148],[783,1144],[813,1185],[832,1238],[828,1309],[806,1356],[775,1378],[744,1372],[731,1352],[737,1308],[724,1269],[729,1222]]],
 ['Cuff_ScreenR','Arm_ScreenR',[[706,1039],[754,1023],[787,1050],[805,1101],[792,1144],[750,1162],[731,1126]]],
 ['Forearm_ScreenR','Arm_ScreenR',[[650,802],[706,792],[724,851],[741,919],[755,981],[764,1038],[710,1064],[695,1008],[682,955],[669,891]]],
 ['UpperArm_ScreenR','Arm_ScreenR',[[573,465],[608,468],[641,486],[660,526],[674,590],[687,652],[698,716],[707,792],[650,820],[637,755],[625,691],[613,629],[597,568],[583,517]]],
 ['Hair_Side_ScreenL','Hair_Side',[[353,239],[389,250],[411,314],[416,373],[435,424],[447,460],[465,482],[424,471],[402,443],[391,399],[380,355],[368,306]]],
 ['Hair_Side_ScreenR','Hair_Side',[[552,250],[585,221],[596,263],[584,313],[577,352],[581,392],[607,440],[624,483],[611,485],[588,451],[558,422],[546,379],[552,322]]],
 ['Face_Neck','Face',[[375,218],[401,207],[435,215],[468,219],[500,235],[534,252],[556,273],[551,303],[532,335],[504,362],[477,377],[468,416],[444,413],[421,385],[405,350],[386,315],[374,282]]],
 ['Hair_Fringe_ScreenR','Hair_Front',[[498,100],[531,123],[563,158],[584,203],[585,243],[565,275],[544,301],[542,276],[554,242],[548,209],[531,181],[507,150]]],
 ['Hair_Fringe_Center','Hair_Front',[[444,104],[490,94],[515,123],[524,152],[526,194],[508,233],[479,260],[486,227],[473,248],[452,251],[466,219],[472,188],[457,159]]],
 ['Hair_Fringe_ScreenL','Hair_Front',[[388,119],[437,100],[462,132],[462,173],[445,207],[422,231],[407,264],[398,304],[386,286],[389,247],[397,206],[382,181]]],
 ['Hair_Crown','Head',[[290,170],[317,125],[376,91],[430,76],[483,70],[530,99],[567,141],[590,194],[589,225],[532,180],[486,148],[440,150],[409,192],[372,239],[329,252],[308,226]]],
 ['Hair_Back_ScreenL','Hair_Back',[[302,219],[346,244],[367,296],[359,340],[329,379],[293,421],[233,476],[199,539],[189,624],[166,726],[140,826],[111,934],[102,997],[73,1032],[69,996],[91,914],[105,817],[126,702],[140,606],[166,522],[199,459],[242,399],[260,323]]],
 ['Hair_Back_ScreenR','Hair_Back',[[569,291],[588,311],[599,356],[623,394],[649,449],[660,498],[678,552],[681,606],[699,651],[714,691],[714,744],[725,775],[707,801],[687,767],[675,720],[651,670],[636,606],[613,548],[605,488],[590,437],[563,377]]],
 ['Coat_ScreenL','Coat',[[288,475],[347,467],[402,538],[431,606],[411,673],[374,750],[335,835],[311,927],[295,1028],[274,1149],[258,1292],[244,1414],[224,1536],[57,1536],[75,1412],[99,1286],[126,1164],[162,1048],[208,924],[254,795],[298,659]]],
 ['Coat_ScreenR','Coat',[[569,478],[606,507],[631,576],[650,663],[675,788],[699,933],[721,1060],[752,1196],[780,1359],[806,1536],[676,1536],[682,1414],[675,1286],[664,1157],[643,1038],[616,886],[605,749],[591,619]]],
 ['Chest_Armor','Torso',[[342,411],[412,386],[467,382],[516,407],[572,439],[597,498],[623,571],[653,646],[646,700],[610,743],[547,762],[471,746],[414,706],[374,628],[350,539]]],
 ['Waist_Armor','Torso',[[400,696],[468,734],[548,759],[613,736],[640,714],[642,812],[635,892],[659,942],[644,995],[564,1011],[475,989],[390,953],[336,907],[362,817]]],
 ['Belt_Harness','Hips',[[334,915],[393,946],[480,971],[561,989],[642,963],[659,992],[658,1084],[630,1151],[568,1166],[490,1142],[410,1102],[334,1080],[313,1020]]],
 ['Leg_ScreenL','Legs',[[305,1080],[392,1114],[472,1152],[476,1251],[464,1380],[450,1536],[245,1536],[262,1395],[279,1264]]],
 ['Leg_ScreenR','Legs',[[480,1152],[558,1175],[631,1148],[672,1100],[681,1221],[667,1359],[639,1536],[450,1536],[460,1380],[475,1251]]],
];
const assigned=new Uint8Array(width*height),layers=[],manifest=[];
function inside(x,y,points){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))hit=!hit;}return hit;}
async function add(name,group,points){
 const data=Buffer.alloc(original.length);let pixels=0,left=width,top=height,right=0,bottom=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,o=i*4;if(assigned[i]||!original[o+3]||(points&&!inside(x+.5,y+.5,points)))continue;
  assigned[i]=1;original.copy(data,o,o,o+4);pixels++;left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);
 }
 if(!pixels)return;
 const crop=await sharp(data,{raw:{width,height,channels:4}}).extract({left,top,width:right-left,height:bottom-top}).raw().toBuffer();
 await sharp(crop,{raw:{width:right-left,height:bottom-top,channels:4}}).png().toFile(path.join(output,`${name}.png`));
 layers.push({name,group,left,top,right,bottom,imageData:{width:right-left,height:bottom-top,data:new Uint8ClampedArray(crop)}});
 manifest.push({name,group,pixels,bounds:[left,top,right,bottom],points});
}
for(const [name,group,points] of regions)await add(name,group,points);
await add('Seam_Residual','Torso',null);
// Reconstruct every source pixel exactly before authoring any deformer.
const reconstructed=Buffer.alloc(original.length);
for(const layer of layers){const l=layer.imageData;for(let y=0;y<l.height;y++)for(let x=0;x<l.width;x++){
 const from=(y*l.width+x)*4;if(!l.data[from+3])continue;const to=((layer.top+y)*width+layer.left+x)*4;reconstructed.set(l.data.subarray(from,from+4),to);
}}
let differences=0;for(let i=0;i<original.length;i++)if((i%4===3||original[i-i%4+3])&&original[i]!==reconstructed[i])differences++;
if(differences)throw Error(`Neutral reconstruction mismatch: ${differences}`);
const children=layers.map(({group,...layer})=>layer).reverse();
await writeFile(path.join(output,'aegis-parts-import.psd'),writePsdBuffer({width,height,imageData:{width,height,data:new Uint8ClampedArray(reconstructed)},children}));
await sharp(reconstructed,{raw:{width,height,channels:4}}).png().toFile(path.join(output,'neutral-reconstruction.png'));
await writeFile(path.join(output,'parts.json'),JSON.stringify({status:'Material separation work file; hidden surfaces and rig quality not approved',canvas:[width,height],neutralPixelDifferences:differences,layers:manifest},null,2));
console.log(JSON.stringify({output,parts:layers.length,neutralPixelDifferences:differences,productionApproved:false,limitations:'Disjoint cuts lack overlap and hidden surfaces; neutral PSD equality is not Cubism render quality approval'}));
