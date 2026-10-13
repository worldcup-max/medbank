(()=>{var Ta="170";var Pl=0,qa=1,Ll=2;var Kc=1,Dl=2,Mn=3,zn=0,Ue=1,sn=2,Fn=0,Ii=1,Ya=2,$a=3,Za=4,Ul=5,ti=100,Nl=101,Ol=102,Fl=103,Bl=104,zl=200,kl=201,Hl=202,Vl=203,no=204,io=205,Gl=206,Wl=207,Xl=208,ql=209,Yl=210,$l=211,Zl=212,Jl=213,Kl=214,so=0,ro=1,oo=2,Ui=3,ao=4,co=5,lo=6,ho=7,jc=0,jl=1,Ql=2,Bn=0,th=1,eh=2,nh=3,ih=4,sh=5,rh=6,vs=7;var Qc=300,Ni=301,Oi=302,uo=303,fo=304,gr=306,po=1e3,ii=1001,mo=1002,on=1003,oh=1004;var ws=1005;var dn=1006,Sr=1007;var si=1008;var Tn=1009,tl=1010,el=1011,ms=1012,Aa=1013,ri=1014,Sn=1015,Ms=1016,Ca=1017,Ra=1018,Fi=1020,nl=35902,il=1021,sl=1022,rn=1023,rl=1024,ol=1025,Pi=1026,Bi=1027,al=1028,Ia=1029,cl=1030,Pa=1031;var La=1033,$s=33776,Zs=33777,Js=33778,Ks=33779,go=35840,xo=35841,_o=35842,yo=35843,vo=36196,Mo=37492,bo=37496,So=37808,Eo=37809,wo=37810,To=37811,Ao=37812,Co=37813,Ro=37814,Io=37815,Po=37816,Lo=37817,Do=37818,Uo=37819,No=37820,Oo=37821,js=36492,Fo=36494,Bo=36495,ll=36283,zo=36284,ko=36285,Ho=36286;var Qs=2300,Vo=2301,Er=2302,Ja=2400,Ka=2401,ja=2402;var ah=3200,ch=3201;var hl=0,lh=1,On="",De="srgb",Yi="srgb-linear",xr="linear",fe="srgb";var pi=7680;var Qa=519,hh=512,uh=513,dh=514,ul=515,fh=516,ph=517,mh=518,gh=519,tc=35044;var ec="300 es",En=2e3,tr=2001,kn=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;let n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;let s=this._listeners[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;let n=this._listeners[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}},Pe=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],nc=1234567,hs=Math.PI/180,gs=180/Math.PI;function $i(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Pe[i&255]+Pe[i>>8&255]+Pe[i>>16&255]+Pe[i>>24&255]+"-"+Pe[t&255]+Pe[t>>8&255]+"-"+Pe[t>>16&15|64]+Pe[t>>24&255]+"-"+Pe[e&63|128]+Pe[e>>8&255]+"-"+Pe[e>>16&255]+Pe[e>>24&255]+Pe[n&255]+Pe[n>>8&255]+Pe[n>>16&255]+Pe[n>>24&255]).toLowerCase()}function Ce(i,t,e){return Math.max(t,Math.min(e,i))}function Da(i,t){return(i%t+t)%t}function xh(i,t,e,n,s){return n+(i-t)*(s-n)/(e-t)}function _h(i,t,e){return i!==t?(e-i)/(t-i):0}function us(i,t,e){return(1-e)*i+e*t}function yh(i,t,e,n){return us(i,t,1-Math.exp(-e*n))}function vh(i,t=1){return t-Math.abs(Da(i,t*2)-t)}function Mh(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function bh(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function Sh(i,t){return i+Math.floor(Math.random()*(t-i+1))}function Eh(i,t){return i+Math.random()*(t-i)}function wh(i){return i*(.5-Math.random())}function Th(i){i!==void 0&&(nc=i);let t=nc+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Ah(i){return i*hs}function Ch(i){return i*gs}function Rh(i){return(i&i-1)===0&&i!==0}function Ih(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function Ph(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Lh(i,t,e,n,s){let r=Math.cos,o=Math.sin,a=r(e/2),c=o(e/2),h=r((t+n)/2),d=o((t+n)/2),u=r((t-n)/2),f=o((t-n)/2),p=r((n-t)/2),g=o((n-t)/2);switch(s){case"XYX":i.set(a*d,c*u,c*f,a*h);break;case"YZY":i.set(c*f,a*d,c*u,a*h);break;case"ZXZ":i.set(c*u,c*f,a*d,a*h);break;case"XZX":i.set(a*d,c*g,c*p,a*h);break;case"YXY":i.set(c*p,a*d,c*g,a*h);break;case"ZYZ":i.set(c*g,c*p,a*d,a*h);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function Ci(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Oe(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var di={DEG2RAD:hs,RAD2DEG:gs,generateUUID:$i,clamp:Ce,euclideanModulo:Da,mapLinear:xh,inverseLerp:_h,lerp:us,damp:yh,pingpong:vh,smoothstep:Mh,smootherstep:bh,randInt:Sh,randFloat:Eh,randFloatSpread:wh,seededRandom:Th,degToRad:Ah,radToDeg:Ch,isPowerOfTwo:Rh,ceilPowerOfTwo:Ih,floorPowerOfTwo:Ph,setQuaternionFromProperEuler:Lh,normalize:Oe,denormalize:Ci},kt=class i{constructor(t=0,e=0){i.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(Ce(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*n-o*s+t.x,this.y=r*s+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Jt=class i{constructor(t,e,n,s,r,o,a,c,h){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,c,h)}set(t,e,n,s,r,o,a,c,h){let d=this.elements;return d[0]=t,d[1]=s,d[2]=a,d[3]=e,d[4]=r,d[5]=c,d[6]=n,d[7]=o,d[8]=h,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[3],c=n[6],h=n[1],d=n[4],u=n[7],f=n[2],p=n[5],g=n[8],x=s[0],m=s[3],l=s[6],E=s[1],y=s[4],v=s[7],D=s[2],I=s[5],P=s[8];return r[0]=o*x+a*E+c*D,r[3]=o*m+a*y+c*I,r[6]=o*l+a*v+c*P,r[1]=h*x+d*E+u*D,r[4]=h*m+d*y+u*I,r[7]=h*l+d*v+u*P,r[2]=f*x+p*E+g*D,r[5]=f*m+p*y+g*I,r[8]=f*l+p*v+g*P,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],c=t[6],h=t[7],d=t[8];return e*o*d-e*a*h-n*r*d+n*a*c+s*r*h-s*o*c}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],c=t[6],h=t[7],d=t[8],u=d*o-a*h,f=a*c-d*r,p=h*r-o*c,g=e*u+n*f+s*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/g;return t[0]=u*x,t[1]=(s*h-d*n)*x,t[2]=(a*n-s*o)*x,t[3]=f*x,t[4]=(d*e-s*c)*x,t[5]=(s*r-a*e)*x,t[6]=p*x,t[7]=(n*c-h*e)*x,t[8]=(o*e-n*r)*x,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,o,a){let c=Math.cos(r),h=Math.sin(r);return this.set(n*c,n*h,-n*(c*o+h*a)+o+t,-s*h,s*c,-s*(-h*o+c*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(wr.makeScale(t,e)),this}rotate(t){return this.premultiply(wr.makeRotation(-t)),this}translate(t,e){return this.premultiply(wr.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}},wr=new Jt;function dl(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function er(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Dh(){let i=er("canvas");return i.style.display="block",i}var ic={};function cs(i){i in ic||(ic[i]=!0,console.warn(i))}function Uh(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function Nh(i){let t=i.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Oh(i){let t=i.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}var oe={enabled:!0,workingColorSpace:Yi,spaces:{},convert:function(i,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===fe&&(i.r=wn(i.r),i.g=wn(i.g),i.b=wn(i.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(i.applyMatrix3(this.spaces[t].toXYZ),i.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===fe&&(i.r=Li(i.r),i.g=Li(i.g),i.b=Li(i.b))),i},fromWorkingColorSpace:function(i,t){return this.convert(i,this.workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===On?xr:this.spaces[i].transfer},getLuminanceCoefficients:function(i,t=this.workingColorSpace){return i.fromArray(this.spaces[t].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,t,e){return i.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function wn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Li(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var sc=[.64,.33,.3,.6,.15,.06],rc=[.2126,.7152,.0722],oc=[.3127,.329],ac=new Jt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),cc=new Jt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);oe.define({[Yi]:{primaries:sc,whitePoint:oc,transfer:xr,toXYZ:ac,fromXYZ:cc,luminanceCoefficients:rc,workingColorSpaceConfig:{unpackColorSpace:De},outputColorSpaceConfig:{drawingBufferColorSpace:De}},[De]:{primaries:sc,whitePoint:oc,transfer:fe,toXYZ:ac,fromXYZ:cc,luminanceCoefficients:rc,outputColorSpaceConfig:{drawingBufferColorSpace:De}}});var mi,Go=class{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement=="undefined")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{mi===void 0&&(mi=er("canvas")),mi.width=t.width,mi.height=t.height;let n=mi.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=mi}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement!="undefined"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&t instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&t instanceof ImageBitmap){let e=er("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=wn(r[o]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(wn(e[n]/255)*255):e[n]=wn(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},Fh=0,nr=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Fh++}),this.uuid=$i(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Tr(s[o].image)):r.push(Tr(s[o]))}else r=Tr(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function Tr(i){return typeof HTMLImageElement!="undefined"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&i instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&i instanceof ImageBitmap?Go.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var Bh=0,Je=class i extends kn{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=ii,s=ii,r=dn,o=si,a=rn,c=Tn,h=i.DEFAULT_ANISOTROPY,d=On){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Bh++}),this.uuid=$i(),this.name="",this.source=new nr(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=h,this.format=a,this.internalFormat=null,this.type=c,this.offset=new kt(0,0),this.repeat=new kt(1,1),this.center=new kt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Jt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Qc)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case po:t.x=t.x-Math.floor(t.x);break;case ii:t.x=t.x<0?0:1;break;case mo:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case po:t.y=t.y-Math.floor(t.y);break;case ii:t.y=t.y<0?0:1;break;case mo:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};Je.DEFAULT_IMAGE=null;Je.DEFAULT_MAPPING=Qc;Je.DEFAULT_ANISOTROPY=1;var pe=class i{constructor(t=0,e=0,n=0,s=1){i.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*n+o[11]*s+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,c=t.elements,h=c[0],d=c[4],u=c[8],f=c[1],p=c[5],g=c[9],x=c[2],m=c[6],l=c[10];if(Math.abs(d-f)<.01&&Math.abs(u-x)<.01&&Math.abs(g-m)<.01){if(Math.abs(d+f)<.1&&Math.abs(u+x)<.1&&Math.abs(g+m)<.1&&Math.abs(h+p+l-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let y=(h+1)/2,v=(p+1)/2,D=(l+1)/2,I=(d+f)/4,P=(u+x)/4,N=(g+m)/4;return y>v&&y>D?y<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(y),s=I/n,r=P/n):v>D?v<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(v),n=I/s,r=N/s):D<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(D),n=P/r,s=N/r),this.set(n,s,r,e),this}let E=Math.sqrt((m-g)*(m-g)+(u-x)*(u-x)+(f-d)*(f-d));return Math.abs(E)<.001&&(E=1),this.x=(m-g)/E,this.y=(u-x)/E,this.z=(f-d)/E,this.w=Math.acos((h+p+l-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Wo=class extends kn{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new pe(0,0,t,e),this.scissorTest=!1,this.viewport=new pe(0,0,t,e);let s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:dn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);let r=new Je(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];let o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;let e=Object.assign({},t.texture.image);return this.texture.source=new nr(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},An=class extends Wo{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},ir=class extends Je{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=on,this.minFilter=on,this.wrapR=ii,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var Xo=class extends Je{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=on,this.minFilter=on,this.wrapR=ii,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Hn=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,o,a){let c=n[s+0],h=n[s+1],d=n[s+2],u=n[s+3],f=r[o+0],p=r[o+1],g=r[o+2],x=r[o+3];if(a===0){t[e+0]=c,t[e+1]=h,t[e+2]=d,t[e+3]=u;return}if(a===1){t[e+0]=f,t[e+1]=p,t[e+2]=g,t[e+3]=x;return}if(u!==x||c!==f||h!==p||d!==g){let m=1-a,l=c*f+h*p+d*g+u*x,E=l>=0?1:-1,y=1-l*l;if(y>Number.EPSILON){let D=Math.sqrt(y),I=Math.atan2(D,l*E);m=Math.sin(m*I)/D,a=Math.sin(a*I)/D}let v=a*E;if(c=c*m+f*v,h=h*m+p*v,d=d*m+g*v,u=u*m+x*v,m===1-a){let D=1/Math.sqrt(c*c+h*h+d*d+u*u);c*=D,h*=D,d*=D,u*=D}}t[e]=c,t[e+1]=h,t[e+2]=d,t[e+3]=u}static multiplyQuaternionsFlat(t,e,n,s,r,o){let a=n[s],c=n[s+1],h=n[s+2],d=n[s+3],u=r[o],f=r[o+1],p=r[o+2],g=r[o+3];return t[e]=a*g+d*u+c*p-h*f,t[e+1]=c*g+d*f+h*u-a*p,t[e+2]=h*g+d*p+a*f-c*u,t[e+3]=d*g-a*u-c*f-h*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,c=Math.sin,h=a(n/2),d=a(s/2),u=a(r/2),f=c(n/2),p=c(s/2),g=c(r/2);switch(o){case"XYZ":this._x=f*d*u+h*p*g,this._y=h*p*u-f*d*g,this._z=h*d*g+f*p*u,this._w=h*d*u-f*p*g;break;case"YXZ":this._x=f*d*u+h*p*g,this._y=h*p*u-f*d*g,this._z=h*d*g-f*p*u,this._w=h*d*u+f*p*g;break;case"ZXY":this._x=f*d*u-h*p*g,this._y=h*p*u+f*d*g,this._z=h*d*g+f*p*u,this._w=h*d*u-f*p*g;break;case"ZYX":this._x=f*d*u-h*p*g,this._y=h*p*u+f*d*g,this._z=h*d*g-f*p*u,this._w=h*d*u+f*p*g;break;case"YZX":this._x=f*d*u+h*p*g,this._y=h*p*u+f*d*g,this._z=h*d*g-f*p*u,this._w=h*d*u-f*p*g;break;case"XZY":this._x=f*d*u-h*p*g,this._y=h*p*u-f*d*g,this._z=h*d*g+f*p*u,this._w=h*d*u+f*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],o=e[1],a=e[5],c=e[9],h=e[2],d=e[6],u=e[10],f=n+a+u;if(f>0){let p=.5/Math.sqrt(f+1);this._w=.25/p,this._x=(d-c)*p,this._y=(r-h)*p,this._z=(o-s)*p}else if(n>a&&n>u){let p=2*Math.sqrt(1+n-a-u);this._w=(d-c)/p,this._x=.25*p,this._y=(s+o)/p,this._z=(r+h)/p}else if(a>u){let p=2*Math.sqrt(1+a-n-u);this._w=(r-h)/p,this._x=(s+o)/p,this._y=.25*p,this._z=(c+d)/p}else{let p=2*Math.sqrt(1+u-n-a);this._w=(o-s)/p,this._x=(r+h)/p,this._y=(c+d)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Ce(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,o=t._w,a=e._x,c=e._y,h=e._z,d=e._w;return this._x=n*d+o*a+s*h-r*c,this._y=s*d+o*c+r*a-n*h,this._z=r*d+o*h+n*c-s*a,this._w=o*d-n*a-s*c-r*h,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);let n=this._x,s=this._y,r=this._z,o=this._w,a=o*t._w+n*t._x+s*t._y+r*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;let c=1-a*a;if(c<=Number.EPSILON){let p=1-e;return this._w=p*o+e*this._w,this._x=p*n+e*this._x,this._y=p*s+e*this._y,this._z=p*r+e*this._z,this.normalize(),this}let h=Math.sqrt(c),d=Math.atan2(h,a),u=Math.sin((1-e)*d)/h,f=Math.sin(e*d)/h;return this._w=o*u+this._w*f,this._x=n*u+this._x*f,this._y=s*u+this._y*f,this._z=r*u+this._z*f,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},L=class i{constructor(t=0,e=0,n=0){i.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(lc.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(lc.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,o=t.y,a=t.z,c=t.w,h=2*(o*s-a*n),d=2*(a*e-r*s),u=2*(r*n-o*e);return this.x=e+c*h+o*u-a*d,this.y=n+c*d+a*h-r*u,this.z=s+c*u+r*d-o*h,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,o=e.x,a=e.y,c=e.z;return this.x=s*c-r*a,this.y=r*o-n*c,this.z=n*a-s*o,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Ar.copy(this).projectOnVector(t),this.sub(Ar)}reflect(t){return this.sub(Ar.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(Ce(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Ar=new L,lc=new Hn,oi=class{constructor(t=new L(1/0,1/0,1/0),e=new L(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(tn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(tn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=tn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,tn):tn.fromBufferAttribute(r,o),tn.applyMatrix4(t.matrixWorld),this.expandByPoint(tn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Ts.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Ts.copy(n.boundingBox)),Ts.applyMatrix4(t.matrixWorld),this.union(Ts)}let s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,tn),tn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(is),As.subVectors(this.max,is),gi.subVectors(t.a,is),xi.subVectors(t.b,is),_i.subVectors(t.c,is),In.subVectors(xi,gi),Pn.subVectors(_i,xi),Yn.subVectors(gi,_i);let e=[0,-In.z,In.y,0,-Pn.z,Pn.y,0,-Yn.z,Yn.y,In.z,0,-In.x,Pn.z,0,-Pn.x,Yn.z,0,-Yn.x,-In.y,In.x,0,-Pn.y,Pn.x,0,-Yn.y,Yn.x,0];return!Cr(e,gi,xi,_i,As)||(e=[1,0,0,0,1,0,0,0,1],!Cr(e,gi,xi,_i,As))?!1:(Cs.crossVectors(In,Pn),e=[Cs.x,Cs.y,Cs.z],Cr(e,gi,xi,_i,As))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,tn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(tn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(gn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),gn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),gn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),gn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),gn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),gn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),gn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),gn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(gn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}},gn=[new L,new L,new L,new L,new L,new L,new L,new L],tn=new L,Ts=new oi,gi=new L,xi=new L,_i=new L,In=new L,Pn=new L,Yn=new L,is=new L,As=new L,Cs=new L,$n=new L;function Cr(i,t,e,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){$n.fromArray(i,r);let a=s.x*Math.abs($n.x)+s.y*Math.abs($n.y)+s.z*Math.abs($n.z),c=t.dot($n),h=e.dot($n),d=n.dot($n);if(Math.max(-Math.max(c,h,d),Math.min(c,h,d))>a)return!1}return!0}var zh=new oi,ss=new L,Rr=new L,xs=class{constructor(t=new L,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):zh.setFromPoints(t).getCenter(n);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;ss.subVectors(t,this.center);let e=ss.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(ss,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Rr.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(ss.copy(t.center).add(Rr)),this.expandByPoint(ss.copy(t.center).sub(Rr))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}},xn=new L,Ir=new L,Rs=new L,Ln=new L,Pr=new L,Is=new L,Lr=new L,qo=class{constructor(t=new L,e=new L(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,xn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=xn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(xn.copy(this.origin).addScaledVector(this.direction,e),xn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Ir.copy(t).add(e).multiplyScalar(.5),Rs.copy(e).sub(t).normalize(),Ln.copy(this.origin).sub(Ir);let r=t.distanceTo(e)*.5,o=-this.direction.dot(Rs),a=Ln.dot(this.direction),c=-Ln.dot(Rs),h=Ln.lengthSq(),d=Math.abs(1-o*o),u,f,p,g;if(d>0)if(u=o*c-a,f=o*a-c,g=r*d,u>=0)if(f>=-g)if(f<=g){let x=1/d;u*=x,f*=x,p=u*(u+o*f+2*a)+f*(o*u+f+2*c)+h}else f=r,u=Math.max(0,-(o*f+a)),p=-u*u+f*(f+2*c)+h;else f=-r,u=Math.max(0,-(o*f+a)),p=-u*u+f*(f+2*c)+h;else f<=-g?(u=Math.max(0,-(-o*r+a)),f=u>0?-r:Math.min(Math.max(-r,-c),r),p=-u*u+f*(f+2*c)+h):f<=g?(u=0,f=Math.min(Math.max(-r,-c),r),p=f*(f+2*c)+h):(u=Math.max(0,-(o*r+a)),f=u>0?r:Math.min(Math.max(-r,-c),r),p=-u*u+f*(f+2*c)+h);else f=o>0?-r:r,u=Math.max(0,-(o*f+a)),p=-u*u+f*(f+2*c)+h;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(Ir).addScaledVector(Rs,f),p}intersectSphere(t,e){xn.subVectors(t.center,this.origin);let n=xn.dot(this.direction),s=xn.dot(xn)-n*n,r=t.radius*t.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=n-o,c=n+o;return c<0?null:a<0?this.at(c,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,o,a,c,h=1/this.direction.x,d=1/this.direction.y,u=1/this.direction.z,f=this.origin;return h>=0?(n=(t.min.x-f.x)*h,s=(t.max.x-f.x)*h):(n=(t.max.x-f.x)*h,s=(t.min.x-f.x)*h),d>=0?(r=(t.min.y-f.y)*d,o=(t.max.y-f.y)*d):(r=(t.max.y-f.y)*d,o=(t.min.y-f.y)*d),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),u>=0?(a=(t.min.z-f.z)*u,c=(t.max.z-f.z)*u):(a=(t.max.z-f.z)*u,c=(t.min.z-f.z)*u),n>c||a>s)||((a>n||n!==n)&&(n=a),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,xn)!==null}intersectTriangle(t,e,n,s,r){Pr.subVectors(e,t),Is.subVectors(n,t),Lr.crossVectors(Pr,Is);let o=this.direction.dot(Lr),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Ln.subVectors(this.origin,t);let c=a*this.direction.dot(Is.crossVectors(Ln,Is));if(c<0)return null;let h=a*this.direction.dot(Pr.cross(Ln));if(h<0||c+h>o)return null;let d=-a*Ln.dot(Lr);return d<0?null:this.at(d/o,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},_e=class i{constructor(t,e,n,s,r,o,a,c,h,d,u,f,p,g,x,m){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,c,h,d,u,f,p,g,x,m)}set(t,e,n,s,r,o,a,c,h,d,u,f,p,g,x,m){let l=this.elements;return l[0]=t,l[4]=e,l[8]=n,l[12]=s,l[1]=r,l[5]=o,l[9]=a,l[13]=c,l[2]=h,l[6]=d,l[10]=u,l[14]=f,l[3]=p,l[7]=g,l[11]=x,l[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){let e=this.elements,n=t.elements,s=1/yi.setFromMatrixColumn(t,0).length(),r=1/yi.setFromMatrixColumn(t,1).length(),o=1/yi.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(s),h=Math.sin(s),d=Math.cos(r),u=Math.sin(r);if(t.order==="XYZ"){let f=o*d,p=o*u,g=a*d,x=a*u;e[0]=c*d,e[4]=-c*u,e[8]=h,e[1]=p+g*h,e[5]=f-x*h,e[9]=-a*c,e[2]=x-f*h,e[6]=g+p*h,e[10]=o*c}else if(t.order==="YXZ"){let f=c*d,p=c*u,g=h*d,x=h*u;e[0]=f+x*a,e[4]=g*a-p,e[8]=o*h,e[1]=o*u,e[5]=o*d,e[9]=-a,e[2]=p*a-g,e[6]=x+f*a,e[10]=o*c}else if(t.order==="ZXY"){let f=c*d,p=c*u,g=h*d,x=h*u;e[0]=f-x*a,e[4]=-o*u,e[8]=g+p*a,e[1]=p+g*a,e[5]=o*d,e[9]=x-f*a,e[2]=-o*h,e[6]=a,e[10]=o*c}else if(t.order==="ZYX"){let f=o*d,p=o*u,g=a*d,x=a*u;e[0]=c*d,e[4]=g*h-p,e[8]=f*h+x,e[1]=c*u,e[5]=x*h+f,e[9]=p*h-g,e[2]=-h,e[6]=a*c,e[10]=o*c}else if(t.order==="YZX"){let f=o*c,p=o*h,g=a*c,x=a*h;e[0]=c*d,e[4]=x-f*u,e[8]=g*u+p,e[1]=u,e[5]=o*d,e[9]=-a*d,e[2]=-h*d,e[6]=p*u+g,e[10]=f-x*u}else if(t.order==="XZY"){let f=o*c,p=o*h,g=a*c,x=a*h;e[0]=c*d,e[4]=-u,e[8]=h*d,e[1]=f*u+x,e[5]=o*d,e[9]=p*u-g,e[2]=g*u-p,e[6]=a*d,e[10]=x*u+f}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(kh,t,Hh)}lookAt(t,e,n){let s=this.elements;return Ge.subVectors(t,e),Ge.lengthSq()===0&&(Ge.z=1),Ge.normalize(),Dn.crossVectors(n,Ge),Dn.lengthSq()===0&&(Math.abs(n.z)===1?Ge.x+=1e-4:Ge.z+=1e-4,Ge.normalize(),Dn.crossVectors(n,Ge)),Dn.normalize(),Ps.crossVectors(Ge,Dn),s[0]=Dn.x,s[4]=Ps.x,s[8]=Ge.x,s[1]=Dn.y,s[5]=Ps.y,s[9]=Ge.y,s[2]=Dn.z,s[6]=Ps.z,s[10]=Ge.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[4],c=n[8],h=n[12],d=n[1],u=n[5],f=n[9],p=n[13],g=n[2],x=n[6],m=n[10],l=n[14],E=n[3],y=n[7],v=n[11],D=n[15],I=s[0],P=s[4],N=s[8],w=s[12],b=s[1],U=s[5],V=s[9],H=s[13],W=s[2],$=s[6],G=s[10],rt=s[14],q=s[3],ut=s[7],Mt=s[11],Ct=s[15];return r[0]=o*I+a*b+c*W+h*q,r[4]=o*P+a*U+c*$+h*ut,r[8]=o*N+a*V+c*G+h*Mt,r[12]=o*w+a*H+c*rt+h*Ct,r[1]=d*I+u*b+f*W+p*q,r[5]=d*P+u*U+f*$+p*ut,r[9]=d*N+u*V+f*G+p*Mt,r[13]=d*w+u*H+f*rt+p*Ct,r[2]=g*I+x*b+m*W+l*q,r[6]=g*P+x*U+m*$+l*ut,r[10]=g*N+x*V+m*G+l*Mt,r[14]=g*w+x*H+m*rt+l*Ct,r[3]=E*I+y*b+v*W+D*q,r[7]=E*P+y*U+v*$+D*ut,r[11]=E*N+y*V+v*G+D*Mt,r[15]=E*w+y*H+v*rt+D*Ct,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],o=t[1],a=t[5],c=t[9],h=t[13],d=t[2],u=t[6],f=t[10],p=t[14],g=t[3],x=t[7],m=t[11],l=t[15];return g*(+r*c*u-s*h*u-r*a*f+n*h*f+s*a*p-n*c*p)+x*(+e*c*p-e*h*f+r*o*f-s*o*p+s*h*d-r*c*d)+m*(+e*h*u-e*a*p-r*o*u+n*o*p+r*a*d-n*h*d)+l*(-s*a*d-e*c*u+e*a*f+s*o*u-n*o*f+n*c*d)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],c=t[6],h=t[7],d=t[8],u=t[9],f=t[10],p=t[11],g=t[12],x=t[13],m=t[14],l=t[15],E=u*m*h-x*f*h+x*c*p-a*m*p-u*c*l+a*f*l,y=g*f*h-d*m*h-g*c*p+o*m*p+d*c*l-o*f*l,v=d*x*h-g*u*h+g*a*p-o*x*p-d*a*l+o*u*l,D=g*u*c-d*x*c-g*a*f+o*x*f+d*a*m-o*u*m,I=e*E+n*y+s*v+r*D;if(I===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let P=1/I;return t[0]=E*P,t[1]=(x*f*r-u*m*r-x*s*p+n*m*p+u*s*l-n*f*l)*P,t[2]=(a*m*r-x*c*r+x*s*h-n*m*h-a*s*l+n*c*l)*P,t[3]=(u*c*r-a*f*r-u*s*h+n*f*h+a*s*p-n*c*p)*P,t[4]=y*P,t[5]=(d*m*r-g*f*r+g*s*p-e*m*p-d*s*l+e*f*l)*P,t[6]=(g*c*r-o*m*r-g*s*h+e*m*h+o*s*l-e*c*l)*P,t[7]=(o*f*r-d*c*r+d*s*h-e*f*h-o*s*p+e*c*p)*P,t[8]=v*P,t[9]=(g*u*r-d*x*r-g*n*p+e*x*p+d*n*l-e*u*l)*P,t[10]=(o*x*r-g*a*r+g*n*h-e*x*h-o*n*l+e*a*l)*P,t[11]=(d*a*r-o*u*r-d*n*h+e*u*h+o*n*p-e*a*p)*P,t[12]=D*P,t[13]=(d*x*s-g*u*s+g*n*f-e*x*f-d*n*m+e*u*m)*P,t[14]=(g*a*s-o*x*s-g*n*c+e*x*c+o*n*m-e*a*m)*P,t[15]=(o*u*s-d*a*s+d*n*c-e*u*c-o*n*f+e*a*f)*P,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,o=t.x,a=t.y,c=t.z,h=r*o,d=r*a;return this.set(h*o+n,h*a-s*c,h*c+s*a,0,h*a+s*c,d*a+n,d*c-s*o,0,h*c-s*a,d*c+s*o,r*c*c+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,o){return this.set(1,n,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,o=e._y,a=e._z,c=e._w,h=r+r,d=o+o,u=a+a,f=r*h,p=r*d,g=r*u,x=o*d,m=o*u,l=a*u,E=c*h,y=c*d,v=c*u,D=n.x,I=n.y,P=n.z;return s[0]=(1-(x+l))*D,s[1]=(p+v)*D,s[2]=(g-y)*D,s[3]=0,s[4]=(p-v)*I,s[5]=(1-(f+l))*I,s[6]=(m+E)*I,s[7]=0,s[8]=(g+y)*P,s[9]=(m-E)*P,s[10]=(1-(f+x))*P,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements,r=yi.set(s[0],s[1],s[2]).length(),o=yi.set(s[4],s[5],s[6]).length(),a=yi.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],en.copy(this);let h=1/r,d=1/o,u=1/a;return en.elements[0]*=h,en.elements[1]*=h,en.elements[2]*=h,en.elements[4]*=d,en.elements[5]*=d,en.elements[6]*=d,en.elements[8]*=u,en.elements[9]*=u,en.elements[10]*=u,e.setFromRotationMatrix(en),n.x=r,n.y=o,n.z=a,this}makePerspective(t,e,n,s,r,o,a=En){let c=this.elements,h=2*r/(e-t),d=2*r/(n-s),u=(e+t)/(e-t),f=(n+s)/(n-s),p,g;if(a===En)p=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(a===tr)p=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=h,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=d,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=g,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,s,r,o,a=En){let c=this.elements,h=1/(e-t),d=1/(n-s),u=1/(o-r),f=(e+t)*h,p=(n+s)*d,g,x;if(a===En)g=(o+r)*u,x=-2*u;else if(a===tr)g=r*u,x=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=2*h,c[4]=0,c[8]=0,c[12]=-f,c[1]=0,c[5]=2*d,c[9]=0,c[13]=-p,c[2]=0,c[6]=0,c[10]=x,c[14]=-g,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},yi=new L,en=new _e,kh=new L(0,0,0),Hh=new L(1,1,1),Dn=new L,Ps=new L,Ge=new L,hc=new _e,uc=new Hn,fn=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],o=s[4],a=s[8],c=s[1],h=s[5],d=s[9],u=s[2],f=s[6],p=s[10];switch(e){case"XYZ":this._y=Math.asin(Ce(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-d,p),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(f,h),this._z=0);break;case"YXZ":this._x=Math.asin(-Ce(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(a,p),this._z=Math.atan2(c,h)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ce(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-u,p),this._z=Math.atan2(-o,h)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Ce(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(f,p),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-o,h));break;case"YZX":this._z=Math.asin(Ce(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-d,h),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,p));break;case"XZY":this._z=Math.asin(-Ce(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,h),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-d,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return hc.makeRotationFromQuaternion(t),this.setFromRotationMatrix(hc,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return uc.setFromEuler(this),this.setFromQuaternion(uc,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};fn.DEFAULT_ORDER="XYZ";var sr=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},Vh=0,dc=new L,vi=new Hn,_n=new _e,Ls=new L,rs=new L,Gh=new L,Wh=new Hn,fc=new L(1,0,0),pc=new L(0,1,0),mc=new L(0,0,1),gc={type:"added"},Xh={type:"removed"},Mi={type:"childadded",child:null},Dr={type:"childremoved",child:null},Be=class i extends kn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Vh++}),this.uuid=$i(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new L,e=new fn,n=new Hn,s=new L(1,1,1);function r(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new _e},normalMatrix:{value:new Jt}}),this.matrix=new _e,this.matrixWorld=new _e,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new sr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return vi.setFromAxisAngle(t,e),this.quaternion.multiply(vi),this}rotateOnWorldAxis(t,e){return vi.setFromAxisAngle(t,e),this.quaternion.premultiply(vi),this}rotateX(t){return this.rotateOnAxis(fc,t)}rotateY(t){return this.rotateOnAxis(pc,t)}rotateZ(t){return this.rotateOnAxis(mc,t)}translateOnAxis(t,e){return dc.copy(t).applyQuaternion(this.quaternion),this.position.add(dc.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(fc,t)}translateY(t){return this.translateOnAxis(pc,t)}translateZ(t){return this.translateOnAxis(mc,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(_n.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Ls.copy(t):Ls.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),rs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?_n.lookAt(rs,Ls,this.up):_n.lookAt(Ls,rs,this.up),this.quaternion.setFromRotationMatrix(_n),s&&(_n.extractRotation(s.matrixWorld),vi.setFromRotationMatrix(_n),this.quaternion.premultiply(vi.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(gc),Mi.child=t,this.dispatchEvent(Mi),Mi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Xh),Dr.child=t,this.dispatchEvent(Dr),Dr.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),_n.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),_n.multiply(t.parent.matrixWorld)),t.applyMatrix4(_n),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(gc),Mi.child=t,this.dispatchEvent(Mi),Mi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(rs,t,Gh),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(rs,Wh,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){let n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let c=a.shapes;if(Array.isArray(c))for(let h=0,d=c.length;h<d;h++){let u=c[h];r(t.shapes,u)}else r(t.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let c=0,h=this.material.length;c<h;c++)a.push(r(t.materials,this.material[c]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let c=this.animations[a];s.animations.push(r(t.animations,c))}}if(e){let a=o(t.geometries),c=o(t.materials),h=o(t.textures),d=o(t.images),u=o(t.shapes),f=o(t.skeletons),p=o(t.animations),g=o(t.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),h.length>0&&(n.textures=h),d.length>0&&(n.images=d),u.length>0&&(n.shapes=u),f.length>0&&(n.skeletons=f),p.length>0&&(n.animations=p),g.length>0&&(n.nodes=g)}return n.object=s,n;function o(a){let c=[];for(let h in a){let d=a[h];delete d.metadata,c.push(d)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}};Be.DEFAULT_UP=new L(0,1,0);Be.DEFAULT_MATRIX_AUTO_UPDATE=!0;Be.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var nn=new L,yn=new L,Ur=new L,vn=new L,bi=new L,Si=new L,xc=new L,Nr=new L,Or=new L,Fr=new L,Br=new pe,zr=new pe,kr=new pe,ei=class i{constructor(t=new L,e=new L,n=new L){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),nn.subVectors(t,e),s.cross(nn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){nn.subVectors(s,e),yn.subVectors(n,e),Ur.subVectors(t,e);let o=nn.dot(nn),a=nn.dot(yn),c=nn.dot(Ur),h=yn.dot(yn),d=yn.dot(Ur),u=o*h-a*a;if(u===0)return r.set(0,0,0),null;let f=1/u,p=(h*c-a*d)*f,g=(o*d-a*c)*f;return r.set(1-p-g,g,p)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,vn)===null?!1:vn.x>=0&&vn.y>=0&&vn.x+vn.y<=1}static getInterpolation(t,e,n,s,r,o,a,c){return this.getBarycoord(t,e,n,s,vn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,vn.x),c.addScaledVector(o,vn.y),c.addScaledVector(a,vn.z),c)}static getInterpolatedAttribute(t,e,n,s,r,o){return Br.setScalar(0),zr.setScalar(0),kr.setScalar(0),Br.fromBufferAttribute(t,e),zr.fromBufferAttribute(t,n),kr.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(Br,r.x),o.addScaledVector(zr,r.y),o.addScaledVector(kr,r.z),o}static isFrontFacing(t,e,n,s){return nn.subVectors(n,e),yn.subVectors(t,e),nn.cross(yn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return nn.subVectors(this.c,this.b),yn.subVectors(this.a,this.b),nn.cross(yn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,o,a;bi.subVectors(s,n),Si.subVectors(r,n),Nr.subVectors(t,n);let c=bi.dot(Nr),h=Si.dot(Nr);if(c<=0&&h<=0)return e.copy(n);Or.subVectors(t,s);let d=bi.dot(Or),u=Si.dot(Or);if(d>=0&&u<=d)return e.copy(s);let f=c*u-d*h;if(f<=0&&c>=0&&d<=0)return o=c/(c-d),e.copy(n).addScaledVector(bi,o);Fr.subVectors(t,r);let p=bi.dot(Fr),g=Si.dot(Fr);if(g>=0&&p<=g)return e.copy(r);let x=p*h-c*g;if(x<=0&&h>=0&&g<=0)return a=h/(h-g),e.copy(n).addScaledVector(Si,a);let m=d*g-p*u;if(m<=0&&u-d>=0&&p-g>=0)return xc.subVectors(r,s),a=(u-d)/(u-d+(p-g)),e.copy(s).addScaledVector(xc,a);let l=1/(m+x+f);return o=x*l,a=f*l,e.copy(n).addScaledVector(bi,o).addScaledVector(Si,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},fl={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Un={h:0,s:0,l:0},Ds={h:0,s:0,l:0};function Hr(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var ie=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=De){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,oe.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=oe.workingColorSpace){return this.r=t,this.g=e,this.b=n,oe.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=oe.workingColorSpace){if(t=Da(t,1),e=Ce(e,0,1),n=Ce(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,o=2*n-r;this.r=Hr(o,r,t+1/3),this.g=Hr(o,r,t),this.b=Hr(o,r,t-1/3)}return oe.toWorkingColorSpace(this,s),this}setStyle(t,e=De){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=De){let n=fl[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=wn(t.r),this.g=wn(t.g),this.b=wn(t.b),this}copyLinearToSRGB(t){return this.r=Li(t.r),this.g=Li(t.g),this.b=Li(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=De){return oe.fromWorkingColorSpace(Le.copy(this),t),Math.round(Ce(Le.r*255,0,255))*65536+Math.round(Ce(Le.g*255,0,255))*256+Math.round(Ce(Le.b*255,0,255))}getHexString(t=De){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=oe.workingColorSpace){oe.fromWorkingColorSpace(Le.copy(this),e);let n=Le.r,s=Le.g,r=Le.b,o=Math.max(n,s,r),a=Math.min(n,s,r),c,h,d=(a+o)/2;if(a===o)c=0,h=0;else{let u=o-a;switch(h=d<=.5?u/(o+a):u/(2-o-a),o){case n:c=(s-r)/u+(s<r?6:0);break;case s:c=(r-n)/u+2;break;case r:c=(n-s)/u+4;break}c/=6}return t.h=c,t.s=h,t.l=d,t}getRGB(t,e=oe.workingColorSpace){return oe.fromWorkingColorSpace(Le.copy(this),e),t.r=Le.r,t.g=Le.g,t.b=Le.b,t}getStyle(t=De){oe.fromWorkingColorSpace(Le.copy(this),t);let e=Le.r,n=Le.g,s=Le.b;return t!==De?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(Un),this.setHSL(Un.h+t,Un.s+e,Un.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Un),t.getHSL(Ds);let n=us(Un.h,Ds.h,e),s=us(Un.s,Ds.s,e),r=us(Un.l,Ds.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Le=new ie;ie.NAMES=fl;var qh=0,ai=class extends kn{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:qh++}),this.uuid=$i(),this.name="",this.blending=Ii,this.side=zn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=no,this.blendDst=io,this.blendEquation=ti,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ie(0,0,0),this.blendAlpha=0,this.depthFunc=Ui,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Qa,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=pi,this.stencilZFail=pi,this.stencilZPass=pi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Ii&&(n.blending=this.blending),this.side!==zn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==no&&(n.blendSrc=this.blendSrc),this.blendDst!==io&&(n.blendDst=this.blendDst),this.blendEquation!==ti&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Ui&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Qa&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==pi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==pi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==pi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let o=[];for(let a in r){let c=r[a];delete c.metadata,o.push(c)}return o}if(e){let r=s(t.textures),o=s(t.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},ke=class extends ai{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new ie(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new fn,this.combine=jc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}};var be=new L,Us=new kt,Ze=class{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=tc,this.updateRanges=[],this.gpuType=Sn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Us.fromBufferAttribute(this,e),Us.applyMatrix3(t),this.setXY(e,Us.x,Us.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)be.fromBufferAttribute(this,e),be.applyMatrix3(t),this.setXYZ(e,be.x,be.y,be.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)be.fromBufferAttribute(this,e),be.applyMatrix4(t),this.setXYZ(e,be.x,be.y,be.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)be.fromBufferAttribute(this,e),be.applyNormalMatrix(t),this.setXYZ(e,be.x,be.y,be.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)be.fromBufferAttribute(this,e),be.transformDirection(t),this.setXYZ(e,be.x,be.y,be.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Ci(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Oe(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Ci(e,this.array)),e}setX(t,e){return this.normalized&&(e=Oe(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Ci(e,this.array)),e}setY(t,e){return this.normalized&&(e=Oe(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Ci(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Oe(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Ci(e,this.array)),e}setW(t,e){return this.normalized&&(e=Oe(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Oe(e,this.array),n=Oe(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=Oe(e,this.array),n=Oe(n,this.array),s=Oe(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=Oe(e,this.array),n=Oe(n,this.array),s=Oe(s,this.array),r=Oe(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==tc&&(t.usage=this.usage),t}};var rr=class extends Ze{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var or=class extends Ze{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var Ie=class extends Ze{constructor(t,e,n){super(new Float32Array(t),e,n)}},Yh=0,Ye=new _e,Vr=new Be,Ei=new L,We=new oi,os=new oi,Ae=new L,He=class i extends kn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Yh++}),this.uuid=$i(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(dl(t)?or:rr)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Jt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return Ye.makeRotationFromQuaternion(t),this.applyMatrix4(Ye),this}rotateX(t){return Ye.makeRotationX(t),this.applyMatrix4(Ye),this}rotateY(t){return Ye.makeRotationY(t),this.applyMatrix4(Ye),this}rotateZ(t){return Ye.makeRotationZ(t),this.applyMatrix4(Ye),this}translate(t,e,n){return Ye.makeTranslation(t,e,n),this.applyMatrix4(Ye),this}scale(t,e,n){return Ye.makeScale(t,e,n),this.applyMatrix4(Ye),this}lookAt(t){return Vr.lookAt(t),Vr.updateMatrix(),this.applyMatrix4(Vr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ei).negate(),this.translate(Ei.x,Ei.y,Ei.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let s=0,r=t.length;s<r;s++){let o=t[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Ie(n,3))}else{for(let n=0,s=e.count;n<s;n++){let r=t[n];e.setXYZ(n,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new oi);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new L(-1/0,-1/0,-1/0),new L(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];We.setFromBufferAttribute(r),this.morphTargetsRelative?(Ae.addVectors(this.boundingBox.min,We.min),this.boundingBox.expandByPoint(Ae),Ae.addVectors(this.boundingBox.max,We.max),this.boundingBox.expandByPoint(Ae)):(this.boundingBox.expandByPoint(We.min),this.boundingBox.expandByPoint(We.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new xs);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new L,1/0);return}if(t){let n=this.boundingSphere.center;if(We.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){let a=e[r];os.setFromBufferAttribute(a),this.morphTargetsRelative?(Ae.addVectors(We.min,os.min),We.expandByPoint(Ae),Ae.addVectors(We.max,os.max),We.expandByPoint(Ae)):(We.expandByPoint(os.min),We.expandByPoint(os.max))}We.getCenter(n);let s=0;for(let r=0,o=t.count;r<o;r++)Ae.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Ae));if(e)for(let r=0,o=e.length;r<o;r++){let a=e[r],c=this.morphTargetsRelative;for(let h=0,d=a.count;h<d;h++)Ae.fromBufferAttribute(a,h),c&&(Ei.fromBufferAttribute(t,h),Ae.add(Ei)),s=Math.max(s,n.distanceToSquared(Ae))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Ze(new Float32Array(4*n.count),4));let o=this.getAttribute("tangent"),a=[],c=[];for(let N=0;N<n.count;N++)a[N]=new L,c[N]=new L;let h=new L,d=new L,u=new L,f=new kt,p=new kt,g=new kt,x=new L,m=new L;function l(N,w,b){h.fromBufferAttribute(n,N),d.fromBufferAttribute(n,w),u.fromBufferAttribute(n,b),f.fromBufferAttribute(r,N),p.fromBufferAttribute(r,w),g.fromBufferAttribute(r,b),d.sub(h),u.sub(h),p.sub(f),g.sub(f);let U=1/(p.x*g.y-g.x*p.y);isFinite(U)&&(x.copy(d).multiplyScalar(g.y).addScaledVector(u,-p.y).multiplyScalar(U),m.copy(u).multiplyScalar(p.x).addScaledVector(d,-g.x).multiplyScalar(U),a[N].add(x),a[w].add(x),a[b].add(x),c[N].add(m),c[w].add(m),c[b].add(m))}let E=this.groups;E.length===0&&(E=[{start:0,count:t.count}]);for(let N=0,w=E.length;N<w;++N){let b=E[N],U=b.start,V=b.count;for(let H=U,W=U+V;H<W;H+=3)l(t.getX(H+0),t.getX(H+1),t.getX(H+2))}let y=new L,v=new L,D=new L,I=new L;function P(N){D.fromBufferAttribute(s,N),I.copy(D);let w=a[N];y.copy(w),y.sub(D.multiplyScalar(D.dot(w))).normalize(),v.crossVectors(I,w);let U=v.dot(c[N])<0?-1:1;o.setXYZW(N,y.x,y.y,y.z,U)}for(let N=0,w=E.length;N<w;++N){let b=E[N],U=b.start,V=b.count;for(let H=U,W=U+V;H<W;H+=3)P(t.getX(H+0)),P(t.getX(H+1)),P(t.getX(H+2))}}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Ze(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let f=0,p=n.count;f<p;f++)n.setXYZ(f,0,0,0);let s=new L,r=new L,o=new L,a=new L,c=new L,h=new L,d=new L,u=new L;if(t)for(let f=0,p=t.count;f<p;f+=3){let g=t.getX(f+0),x=t.getX(f+1),m=t.getX(f+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,x),o.fromBufferAttribute(e,m),d.subVectors(o,r),u.subVectors(s,r),d.cross(u),a.fromBufferAttribute(n,g),c.fromBufferAttribute(n,x),h.fromBufferAttribute(n,m),a.add(d),c.add(d),h.add(d),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(x,c.x,c.y,c.z),n.setXYZ(m,h.x,h.y,h.z)}else for(let f=0,p=e.count;f<p;f+=3)s.fromBufferAttribute(e,f+0),r.fromBufferAttribute(e,f+1),o.fromBufferAttribute(e,f+2),d.subVectors(o,r),u.subVectors(s,r),d.cross(u),n.setXYZ(f+0,d.x,d.y,d.z),n.setXYZ(f+1,d.x,d.y,d.z),n.setXYZ(f+2,d.x,d.y,d.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Ae.fromBufferAttribute(t,e),Ae.normalize(),t.setXYZ(e,Ae.x,Ae.y,Ae.z)}toNonIndexed(){function t(a,c){let h=a.array,d=a.itemSize,u=a.normalized,f=new h.constructor(c.length*d),p=0,g=0;for(let x=0,m=c.length;x<m;x++){a.isInterleavedBufferAttribute?p=c[x]*a.data.stride+a.offset:p=c[x]*d;for(let l=0;l<d;l++)f[g++]=h[p++]}return new Ze(f,d,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let a in s){let c=s[a],h=t(c,n);e.setAttribute(a,h)}let r=this.morphAttributes;for(let a in r){let c=[],h=r[a];for(let d=0,u=h.length;d<u;d++){let f=h[d],p=t(f,n);c.push(p)}e.morphAttributes[a]=c}e.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,c=o.length;a<c;a++){let h=o[a];e.addGroup(h.start,h.count,h.materialIndex)}return e}toJSON(){let t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){let c=this.parameters;for(let h in c)c[h]!==void 0&&(t[h]=c[h]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let c in n){let h=n[c];t.data.attributes[c]=h.toJSON(t.data)}let s={},r=!1;for(let c in this.morphAttributes){let h=this.morphAttributes[c],d=[];for(let u=0,f=h.length;u<f;u++){let p=h[u];d.push(p.toJSON(t.data))}d.length>0&&(s[c]=d,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone(e));let s=t.attributes;for(let h in s){let d=s[h];this.setAttribute(h,d.clone(e))}let r=t.morphAttributes;for(let h in r){let d=[],u=r[h];for(let f=0,p=u.length;f<p;f++)d.push(u[f].clone(e));this.morphAttributes[h]=d}this.morphTargetsRelative=t.morphTargetsRelative;let o=t.groups;for(let h=0,d=o.length;h<d;h++){let u=o[h];this.addGroup(u.start,u.count,u.materialIndex)}let a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());let c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},_c=new _e,Zn=new qo,Ns=new xs,yc=new L,Os=new L,Fs=new L,Bs=new L,Gr=new L,zs=new L,vc=new L,ks=new L,Yt=class extends Be{constructor(t=new He,e=new ke){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let a=this.morphTargetInfluences;if(r&&a){zs.set(0,0,0);for(let c=0,h=r.length;c<h;c++){let d=a[c],u=r[c];d!==0&&(Gr.fromBufferAttribute(u,t),o?zs.addScaledVector(Gr,d):zs.addScaledVector(Gr.sub(e),d))}e.add(zs)}return e}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Ns.copy(n.boundingSphere),Ns.applyMatrix4(r),Zn.copy(t.ray).recast(t.near),!(Ns.containsPoint(Zn.origin)===!1&&(Zn.intersectSphere(Ns,yc)===null||Zn.origin.distanceToSquared(yc)>(t.far-t.near)**2))&&(_c.copy(r).invert(),Zn.copy(t.ray).applyMatrix4(_c),!(n.boundingBox!==null&&Zn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Zn)))}_computeIntersections(t,e,n){let s,r=this.geometry,o=this.material,a=r.index,c=r.attributes.position,h=r.attributes.uv,d=r.attributes.uv1,u=r.attributes.normal,f=r.groups,p=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,x=f.length;g<x;g++){let m=f[g],l=o[m.materialIndex],E=Math.max(m.start,p.start),y=Math.min(a.count,Math.min(m.start+m.count,p.start+p.count));for(let v=E,D=y;v<D;v+=3){let I=a.getX(v),P=a.getX(v+1),N=a.getX(v+2);s=Hs(this,l,t,n,h,d,u,I,P,N),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{let g=Math.max(0,p.start),x=Math.min(a.count,p.start+p.count);for(let m=g,l=x;m<l;m+=3){let E=a.getX(m),y=a.getX(m+1),v=a.getX(m+2);s=Hs(this,o,t,n,h,d,u,E,y,v),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}else if(c!==void 0)if(Array.isArray(o))for(let g=0,x=f.length;g<x;g++){let m=f[g],l=o[m.materialIndex],E=Math.max(m.start,p.start),y=Math.min(c.count,Math.min(m.start+m.count,p.start+p.count));for(let v=E,D=y;v<D;v+=3){let I=v,P=v+1,N=v+2;s=Hs(this,l,t,n,h,d,u,I,P,N),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{let g=Math.max(0,p.start),x=Math.min(c.count,p.start+p.count);for(let m=g,l=x;m<l;m+=3){let E=m,y=m+1,v=m+2;s=Hs(this,o,t,n,h,d,u,E,y,v),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}}};function $h(i,t,e,n,s,r,o,a){let c;if(t.side===Ue?c=n.intersectTriangle(o,r,s,!0,a):c=n.intersectTriangle(s,r,o,t.side===zn,a),c===null)return null;ks.copy(a),ks.applyMatrix4(i.matrixWorld);let h=e.ray.origin.distanceTo(ks);return h<e.near||h>e.far?null:{distance:h,point:ks.clone(),object:i}}function Hs(i,t,e,n,s,r,o,a,c,h){i.getVertexPosition(a,Os),i.getVertexPosition(c,Fs),i.getVertexPosition(h,Bs);let d=$h(i,t,e,n,Os,Fs,Bs,vc);if(d){let u=new L;ei.getBarycoord(vc,Os,Fs,Bs,u),s&&(d.uv=ei.getInterpolatedAttribute(s,a,c,h,u,new kt)),r&&(d.uv1=ei.getInterpolatedAttribute(r,a,c,h,u,new kt)),o&&(d.normal=ei.getInterpolatedAttribute(o,a,c,h,u,new L),d.normal.dot(n.direction)>0&&d.normal.multiplyScalar(-1));let f={a,b:c,c:h,normal:new L,materialIndex:0};ei.getNormal(Os,Fs,Bs,f.normal),d.face=f,d.barycoord=u}return d}var ci=class i extends He{constructor(t=1,e=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let c=[],h=[],d=[],u=[],f=0,p=0;g("z","y","x",-1,-1,n,e,t,o,r,0),g("z","y","x",1,-1,n,e,-t,o,r,1),g("x","z","y",1,1,t,n,e,s,o,2),g("x","z","y",1,-1,t,n,-e,s,o,3),g("x","y","z",1,-1,t,e,n,s,r,4),g("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(c),this.setAttribute("position",new Ie(h,3)),this.setAttribute("normal",new Ie(d,3)),this.setAttribute("uv",new Ie(u,2));function g(x,m,l,E,y,v,D,I,P,N,w){let b=v/P,U=D/N,V=v/2,H=D/2,W=I/2,$=P+1,G=N+1,rt=0,q=0,ut=new L;for(let Mt=0;Mt<G;Mt++){let Ct=Mt*U-H;for(let Gt=0;Gt<$;Gt++){let se=Gt*b-V;ut[x]=se*E,ut[m]=Ct*y,ut[l]=W,h.push(ut.x,ut.y,ut.z),ut[x]=0,ut[m]=0,ut[l]=I>0?1:-1,d.push(ut.x,ut.y,ut.z),u.push(Gt/P),u.push(1-Mt/N),rt+=1}}for(let Mt=0;Mt<N;Mt++)for(let Ct=0;Ct<P;Ct++){let Gt=f+Ct+$*Mt,se=f+Ct+$*(Mt+1),J=f+(Ct+1)+$*(Mt+1),at=f+(Ct+1)+$*Mt;c.push(Gt,se,at),c.push(se,J,at),q+=6}a.addGroup(p,q,w),p+=q,f+=rt}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};function zi(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function Fe(i){let t={};for(let e=0;e<i.length;e++){let n=zi(i[e]);for(let s in n)t[s]=n[s]}return t}function Zh(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function pl(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:oe.workingColorSpace}var Jh={clone:zi,merge:Fe},Kh=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,jh=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,pn=class extends ai{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Kh,this.fragmentShader=jh,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=zi(t.uniforms),this.uniformsGroups=Zh(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}},ar=class extends Be{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new _e,this.projectionMatrix=new _e,this.projectionMatrixInverse=new _e,this.coordinateSystem=En}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Nn=new L,Mc=new kt,bc=new kt,Re=class extends ar{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=gs*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(hs*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return gs*2*Math.atan(Math.tan(hs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Nn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Nn.x,Nn.y).multiplyScalar(-t/Nn.z),Nn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Nn.x,Nn.y).multiplyScalar(-t/Nn.z)}getViewSize(t,e){return this.getViewBounds(t,Mc,bc),e.subVectors(bc,Mc)}setViewOffset(t,e,n,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(hs*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let c=o.fullWidth,h=o.fullHeight;r+=o.offsetX*s/c,e-=o.offsetY*n/h,s*=o.width/c,n*=o.height/h}let a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}},wi=-90,Ti=1,Yo=class extends Be{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Re(wi,Ti,t,e);s.layers=this.layers,this.add(s);let r=new Re(wi,Ti,t,e);r.layers=this.layers,this.add(r);let o=new Re(wi,Ti,t,e);o.layers=this.layers,this.add(o);let a=new Re(wi,Ti,t,e);a.layers=this.layers,this.add(a);let c=new Re(wi,Ti,t,e);c.layers=this.layers,this.add(c);let h=new Re(wi,Ti,t,e);h.layers=this.layers,this.add(h)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,o,a,c]=e;for(let h of e)this.remove(h);if(t===En)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===tr)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let h of e)this.add(h),h.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,c,h,d]=this.children,u=t.getRenderTarget(),f=t.getActiveCubeFace(),p=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;let x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,o),t.setRenderTarget(n,2,s),t.render(e,a),t.setRenderTarget(n,3,s),t.render(e,c),t.setRenderTarget(n,4,s),t.render(e,h),n.texture.generateMipmaps=x,t.setRenderTarget(n,5,s),t.render(e,d),t.setRenderTarget(u,f,p),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},cr=class extends Je{constructor(t,e,n,s,r,o,a,c,h,d){t=t!==void 0?t:[],e=e!==void 0?e:Ni,super(t,e,n,s,r,o,a,c,h,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},$o=class extends An{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new cr(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:dn}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new ci(5,5,5),r=new pn({name:"CubemapFromEquirect",uniforms:zi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ue,blending:Fn});r.uniforms.tEquirect.value=e;let o=new Yt(s,r),a=e.minFilter;return e.minFilter===si&&(e.minFilter=dn),new Yo(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,n,s){let r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,s);t.setRenderTarget(r)}},Wr=new L,Qh=new L,tu=new Jt,bn=class{constructor(t=new L(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=Wr.subVectors(n,e).cross(Qh.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){let n=t.delta(Wr),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||tu.getNormalMatrix(t),s=this.coplanarPoint(Wr).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},Jn=new xs,Vs=new L,_s=class{constructor(t=new bn,e=new bn,n=new bn,s=new bn,r=new bn,o=new bn){this.planes=[t,e,n,s,r,o]}set(t,e,n,s,r,o){let a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=En){let n=this.planes,s=t.elements,r=s[0],o=s[1],a=s[2],c=s[3],h=s[4],d=s[5],u=s[6],f=s[7],p=s[8],g=s[9],x=s[10],m=s[11],l=s[12],E=s[13],y=s[14],v=s[15];if(n[0].setComponents(c-r,f-h,m-p,v-l).normalize(),n[1].setComponents(c+r,f+h,m+p,v+l).normalize(),n[2].setComponents(c+o,f+d,m+g,v+E).normalize(),n[3].setComponents(c-o,f-d,m-g,v-E).normalize(),n[4].setComponents(c-a,f-u,m-x,v-y).normalize(),e===En)n[5].setComponents(c+a,f+u,m+x,v+y).normalize();else if(e===tr)n[5].setComponents(a,u,x,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Jn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Jn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Jn)}intersectsSprite(t){return Jn.center.set(0,0,0),Jn.radius=.7071067811865476,Jn.applyMatrix4(t.matrixWorld),this.intersectsSphere(Jn)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(Vs.x=s.normal.x>0?t.max.x:t.min.x,Vs.y=s.normal.y>0?t.max.y:t.min.y,Vs.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Vs)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function ml(){let i=null,t=!1,e=null,n=null;function s(r,o){e(r,o),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function eu(i){let t=new WeakMap;function e(a,c){let h=a.array,d=a.usage,u=h.byteLength,f=i.createBuffer();i.bindBuffer(c,f),i.bufferData(c,h,d),a.onUploadCallback();let p;if(h instanceof Float32Array)p=i.FLOAT;else if(h instanceof Uint16Array)a.isFloat16BufferAttribute?p=i.HALF_FLOAT:p=i.UNSIGNED_SHORT;else if(h instanceof Int16Array)p=i.SHORT;else if(h instanceof Uint32Array)p=i.UNSIGNED_INT;else if(h instanceof Int32Array)p=i.INT;else if(h instanceof Int8Array)p=i.BYTE;else if(h instanceof Uint8Array)p=i.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)p=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:f,type:p,bytesPerElement:h.BYTES_PER_ELEMENT,version:a.version,size:u}}function n(a,c,h){let d=c.array,u=c.updateRanges;if(i.bindBuffer(h,a),u.length===0)i.bufferSubData(h,0,d);else{u.sort((p,g)=>p.start-g.start);let f=0;for(let p=1;p<u.length;p++){let g=u[f],x=u[p];x.start<=g.start+g.count+1?g.count=Math.max(g.count,x.start+x.count-g.start):(++f,u[f]=x)}u.length=f+1;for(let p=0,g=u.length;p<g;p++){let x=u[p];i.bufferSubData(h,x.start*d.BYTES_PER_ELEMENT,d,x.start,x.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let c=t.get(a);c&&(i.deleteBuffer(c.buffer),t.delete(a))}function o(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let d=t.get(a);(!d||d.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let h=t.get(a);if(h===void 0)t.set(a,e(a,c));else if(h.version<a.version){if(h.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(h.buffer,a,c),h.version=a.version}}return{get:s,remove:r,update:o}}var lr=class i extends He{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,o=e/2,a=Math.floor(n),c=Math.floor(s),h=a+1,d=c+1,u=t/a,f=e/c,p=[],g=[],x=[],m=[];for(let l=0;l<d;l++){let E=l*f-o;for(let y=0;y<h;y++){let v=y*u-r;g.push(v,-E,0),x.push(0,0,1),m.push(y/a),m.push(1-l/c)}}for(let l=0;l<c;l++)for(let E=0;E<a;E++){let y=E+h*l,v=E+h*(l+1),D=E+1+h*(l+1),I=E+1+h*l;p.push(y,v,I),p.push(v,D,I)}this.setIndex(p),this.setAttribute("position",new Ie(g,3)),this.setAttribute("normal",new Ie(x,3)),this.setAttribute("uv",new Ie(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}},nu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,iu=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,su=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ru=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ou=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,au=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,cu=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,lu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,hu=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,uu=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,du=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,fu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,pu=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,mu=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,gu=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,xu=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,_u=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,yu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,vu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Mu=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,bu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Su=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Eu=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,wu=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Tu=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Au=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Cu=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Ru=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Iu=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Pu=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Lu="gl_FragColor = linearToOutputTexel( gl_FragColor );",Du=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Uu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Nu=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Ou=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Fu=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Bu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,zu=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ku=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Hu=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Vu=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Gu=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Wu=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Xu=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,qu=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Yu=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,$u=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Zu=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Ju=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Ku=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,ju=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Qu=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,td=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,ed=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,nd=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,id=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,sd=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,rd=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,od=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,ad=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,cd=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,ld=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,hd=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,ud=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,dd=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,fd=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,pd=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,md=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,gd=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,xd=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,_d=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,yd=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,vd=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Md=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,bd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Sd=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Ed=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,wd=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Td=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Ad=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Cd=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Rd=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Id=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Pd=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Ld=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Dd=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Ud=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Nd=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Od=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Fd=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Bd=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,zd=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,kd=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Hd=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Vd=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Gd=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Wd=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Xd=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,qd=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Yd=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,$d=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Zd=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Jd=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Kd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,jd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Qd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,tf=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,ef=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,nf=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,sf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,rf=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,of=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,af=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cf=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,lf=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,hf=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,uf=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,df=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,ff=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,pf=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,mf=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,gf=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,xf=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_f=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,yf=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vf=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Mf=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,bf=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Sf=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Ef=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,wf=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Tf=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Af=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Cf=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Rf=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,If=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Pf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Lf=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Df=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Uf=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Nf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Qt={alphahash_fragment:nu,alphahash_pars_fragment:iu,alphamap_fragment:su,alphamap_pars_fragment:ru,alphatest_fragment:ou,alphatest_pars_fragment:au,aomap_fragment:cu,aomap_pars_fragment:lu,batching_pars_vertex:hu,batching_vertex:uu,begin_vertex:du,beginnormal_vertex:fu,bsdfs:pu,iridescence_fragment:mu,bumpmap_pars_fragment:gu,clipping_planes_fragment:xu,clipping_planes_pars_fragment:_u,clipping_planes_pars_vertex:yu,clipping_planes_vertex:vu,color_fragment:Mu,color_pars_fragment:bu,color_pars_vertex:Su,color_vertex:Eu,common:wu,cube_uv_reflection_fragment:Tu,defaultnormal_vertex:Au,displacementmap_pars_vertex:Cu,displacementmap_vertex:Ru,emissivemap_fragment:Iu,emissivemap_pars_fragment:Pu,colorspace_fragment:Lu,colorspace_pars_fragment:Du,envmap_fragment:Uu,envmap_common_pars_fragment:Nu,envmap_pars_fragment:Ou,envmap_pars_vertex:Fu,envmap_physical_pars_fragment:$u,envmap_vertex:Bu,fog_vertex:zu,fog_pars_vertex:ku,fog_fragment:Hu,fog_pars_fragment:Vu,gradientmap_pars_fragment:Gu,lightmap_pars_fragment:Wu,lights_lambert_fragment:Xu,lights_lambert_pars_fragment:qu,lights_pars_begin:Yu,lights_toon_fragment:Zu,lights_toon_pars_fragment:Ju,lights_phong_fragment:Ku,lights_phong_pars_fragment:ju,lights_physical_fragment:Qu,lights_physical_pars_fragment:td,lights_fragment_begin:ed,lights_fragment_maps:nd,lights_fragment_end:id,logdepthbuf_fragment:sd,logdepthbuf_pars_fragment:rd,logdepthbuf_pars_vertex:od,logdepthbuf_vertex:ad,map_fragment:cd,map_pars_fragment:ld,map_particle_fragment:hd,map_particle_pars_fragment:ud,metalnessmap_fragment:dd,metalnessmap_pars_fragment:fd,morphinstance_vertex:pd,morphcolor_vertex:md,morphnormal_vertex:gd,morphtarget_pars_vertex:xd,morphtarget_vertex:_d,normal_fragment_begin:yd,normal_fragment_maps:vd,normal_pars_fragment:Md,normal_pars_vertex:bd,normal_vertex:Sd,normalmap_pars_fragment:Ed,clearcoat_normal_fragment_begin:wd,clearcoat_normal_fragment_maps:Td,clearcoat_pars_fragment:Ad,iridescence_pars_fragment:Cd,opaque_fragment:Rd,packing:Id,premultiplied_alpha_fragment:Pd,project_vertex:Ld,dithering_fragment:Dd,dithering_pars_fragment:Ud,roughnessmap_fragment:Nd,roughnessmap_pars_fragment:Od,shadowmap_pars_fragment:Fd,shadowmap_pars_vertex:Bd,shadowmap_vertex:zd,shadowmask_pars_fragment:kd,skinbase_vertex:Hd,skinning_pars_vertex:Vd,skinning_vertex:Gd,skinnormal_vertex:Wd,specularmap_fragment:Xd,specularmap_pars_fragment:qd,tonemapping_fragment:Yd,tonemapping_pars_fragment:$d,transmission_fragment:Zd,transmission_pars_fragment:Jd,uv_pars_fragment:Kd,uv_pars_vertex:jd,uv_vertex:Qd,worldpos_vertex:tf,background_vert:ef,background_frag:nf,backgroundCube_vert:sf,backgroundCube_frag:rf,cube_vert:of,cube_frag:af,depth_vert:cf,depth_frag:lf,distanceRGBA_vert:hf,distanceRGBA_frag:uf,equirect_vert:df,equirect_frag:ff,linedashed_vert:pf,linedashed_frag:mf,meshbasic_vert:gf,meshbasic_frag:xf,meshlambert_vert:_f,meshlambert_frag:yf,meshmatcap_vert:vf,meshmatcap_frag:Mf,meshnormal_vert:bf,meshnormal_frag:Sf,meshphong_vert:Ef,meshphong_frag:wf,meshphysical_vert:Tf,meshphysical_frag:Af,meshtoon_vert:Cf,meshtoon_frag:Rf,points_vert:If,points_frag:Pf,shadow_vert:Lf,shadow_frag:Df,sprite_vert:Uf,sprite_frag:Nf},yt={common:{diffuse:{value:new ie(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Jt},alphaMap:{value:null},alphaMapTransform:{value:new Jt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Jt}},envmap:{envMap:{value:null},envMapRotation:{value:new Jt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Jt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Jt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Jt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Jt},normalScale:{value:new kt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Jt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Jt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Jt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Jt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ie(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ie(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Jt},alphaTest:{value:0},uvTransform:{value:new Jt}},sprite:{diffuse:{value:new ie(16777215)},opacity:{value:1},center:{value:new kt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Jt},alphaMap:{value:null},alphaMapTransform:{value:new Jt},alphaTest:{value:0}}},un={basic:{uniforms:Fe([yt.common,yt.specularmap,yt.envmap,yt.aomap,yt.lightmap,yt.fog]),vertexShader:Qt.meshbasic_vert,fragmentShader:Qt.meshbasic_frag},lambert:{uniforms:Fe([yt.common,yt.specularmap,yt.envmap,yt.aomap,yt.lightmap,yt.emissivemap,yt.bumpmap,yt.normalmap,yt.displacementmap,yt.fog,yt.lights,{emissive:{value:new ie(0)}}]),vertexShader:Qt.meshlambert_vert,fragmentShader:Qt.meshlambert_frag},phong:{uniforms:Fe([yt.common,yt.specularmap,yt.envmap,yt.aomap,yt.lightmap,yt.emissivemap,yt.bumpmap,yt.normalmap,yt.displacementmap,yt.fog,yt.lights,{emissive:{value:new ie(0)},specular:{value:new ie(1118481)},shininess:{value:30}}]),vertexShader:Qt.meshphong_vert,fragmentShader:Qt.meshphong_frag},standard:{uniforms:Fe([yt.common,yt.envmap,yt.aomap,yt.lightmap,yt.emissivemap,yt.bumpmap,yt.normalmap,yt.displacementmap,yt.roughnessmap,yt.metalnessmap,yt.fog,yt.lights,{emissive:{value:new ie(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Qt.meshphysical_vert,fragmentShader:Qt.meshphysical_frag},toon:{uniforms:Fe([yt.common,yt.aomap,yt.lightmap,yt.emissivemap,yt.bumpmap,yt.normalmap,yt.displacementmap,yt.gradientmap,yt.fog,yt.lights,{emissive:{value:new ie(0)}}]),vertexShader:Qt.meshtoon_vert,fragmentShader:Qt.meshtoon_frag},matcap:{uniforms:Fe([yt.common,yt.bumpmap,yt.normalmap,yt.displacementmap,yt.fog,{matcap:{value:null}}]),vertexShader:Qt.meshmatcap_vert,fragmentShader:Qt.meshmatcap_frag},points:{uniforms:Fe([yt.points,yt.fog]),vertexShader:Qt.points_vert,fragmentShader:Qt.points_frag},dashed:{uniforms:Fe([yt.common,yt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Qt.linedashed_vert,fragmentShader:Qt.linedashed_frag},depth:{uniforms:Fe([yt.common,yt.displacementmap]),vertexShader:Qt.depth_vert,fragmentShader:Qt.depth_frag},normal:{uniforms:Fe([yt.common,yt.bumpmap,yt.normalmap,yt.displacementmap,{opacity:{value:1}}]),vertexShader:Qt.meshnormal_vert,fragmentShader:Qt.meshnormal_frag},sprite:{uniforms:Fe([yt.sprite,yt.fog]),vertexShader:Qt.sprite_vert,fragmentShader:Qt.sprite_frag},background:{uniforms:{uvTransform:{value:new Jt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Qt.background_vert,fragmentShader:Qt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Jt}},vertexShader:Qt.backgroundCube_vert,fragmentShader:Qt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Qt.cube_vert,fragmentShader:Qt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Qt.equirect_vert,fragmentShader:Qt.equirect_frag},distanceRGBA:{uniforms:Fe([yt.common,yt.displacementmap,{referencePosition:{value:new L},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Qt.distanceRGBA_vert,fragmentShader:Qt.distanceRGBA_frag},shadow:{uniforms:Fe([yt.lights,yt.fog,{color:{value:new ie(0)},opacity:{value:1}}]),vertexShader:Qt.shadow_vert,fragmentShader:Qt.shadow_frag}};un.physical={uniforms:Fe([un.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Jt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Jt},clearcoatNormalScale:{value:new kt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Jt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Jt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Jt},sheen:{value:0},sheenColor:{value:new ie(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Jt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Jt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Jt},transmissionSamplerSize:{value:new kt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Jt},attenuationDistance:{value:0},attenuationColor:{value:new ie(0)},specularColor:{value:new ie(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Jt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Jt},anisotropyVector:{value:new kt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Jt}}]),vertexShader:Qt.meshphysical_vert,fragmentShader:Qt.meshphysical_frag};var Gs={r:0,b:0,g:0},Kn=new fn,Of=new _e;function Ff(i,t,e,n,s,r,o){let a=new ie(0),c=r===!0?0:1,h,d,u=null,f=0,p=null;function g(E){let y=E.isScene===!0?E.background:null;return y&&y.isTexture&&(y=(E.backgroundBlurriness>0?e:t).get(y)),y}function x(E){let y=!1,v=g(E);v===null?l(a,c):v&&v.isColor&&(l(v,1),y=!0);let D=i.xr.getEnvironmentBlendMode();D==="additive"?n.buffers.color.setClear(0,0,0,1,o):D==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||y)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(E,y){let v=g(y);v&&(v.isCubeTexture||v.mapping===gr)?(d===void 0&&(d=new Yt(new ci(1,1,1),new pn({name:"BackgroundCubeMaterial",uniforms:zi(un.backgroundCube.uniforms),vertexShader:un.backgroundCube.vertexShader,fragmentShader:un.backgroundCube.fragmentShader,side:Ue,depthTest:!1,depthWrite:!1,fog:!1})),d.geometry.deleteAttribute("normal"),d.geometry.deleteAttribute("uv"),d.onBeforeRender=function(D,I,P){this.matrixWorld.copyPosition(P.matrixWorld)},Object.defineProperty(d.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(d)),Kn.copy(y.backgroundRotation),Kn.x*=-1,Kn.y*=-1,Kn.z*=-1,v.isCubeTexture&&v.isRenderTargetTexture===!1&&(Kn.y*=-1,Kn.z*=-1),d.material.uniforms.envMap.value=v,d.material.uniforms.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,d.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,d.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,d.material.uniforms.backgroundRotation.value.setFromMatrix4(Of.makeRotationFromEuler(Kn)),d.material.toneMapped=oe.getTransfer(v.colorSpace)!==fe,(u!==v||f!==v.version||p!==i.toneMapping)&&(d.material.needsUpdate=!0,u=v,f=v.version,p=i.toneMapping),d.layers.enableAll(),E.unshift(d,d.geometry,d.material,0,0,null)):v&&v.isTexture&&(h===void 0&&(h=new Yt(new lr(2,2),new pn({name:"BackgroundMaterial",uniforms:zi(un.background.uniforms),vertexShader:un.background.vertexShader,fragmentShader:un.background.fragmentShader,side:zn,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),Object.defineProperty(h.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(h)),h.material.uniforms.t2D.value=v,h.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,h.material.toneMapped=oe.getTransfer(v.colorSpace)!==fe,v.matrixAutoUpdate===!0&&v.updateMatrix(),h.material.uniforms.uvTransform.value.copy(v.matrix),(u!==v||f!==v.version||p!==i.toneMapping)&&(h.material.needsUpdate=!0,u=v,f=v.version,p=i.toneMapping),h.layers.enableAll(),E.unshift(h,h.geometry,h.material,0,0,null))}function l(E,y){E.getRGB(Gs,pl(i)),n.buffers.color.setClear(Gs.r,Gs.g,Gs.b,y,o)}return{getClearColor:function(){return a},setClearColor:function(E,y=1){a.set(E),c=y,l(a,c)},getClearAlpha:function(){return c},setClearAlpha:function(E){c=E,l(a,c)},render:x,addToRenderList:m}}function Bf(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=f(null),r=s,o=!1;function a(b,U,V,H,W){let $=!1,G=u(H,V,U);r!==G&&(r=G,h(r.object)),$=p(b,H,V,W),$&&g(b,H,V,W),W!==null&&t.update(W,i.ELEMENT_ARRAY_BUFFER),($||o)&&(o=!1,v(b,U,V,H),W!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(W).buffer))}function c(){return i.createVertexArray()}function h(b){return i.bindVertexArray(b)}function d(b){return i.deleteVertexArray(b)}function u(b,U,V){let H=V.wireframe===!0,W=n[b.id];W===void 0&&(W={},n[b.id]=W);let $=W[U.id];$===void 0&&($={},W[U.id]=$);let G=$[H];return G===void 0&&(G=f(c()),$[H]=G),G}function f(b){let U=[],V=[],H=[];for(let W=0;W<e;W++)U[W]=0,V[W]=0,H[W]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:V,attributeDivisors:H,object:b,attributes:{},index:null}}function p(b,U,V,H){let W=r.attributes,$=U.attributes,G=0,rt=V.getAttributes();for(let q in rt)if(rt[q].location>=0){let Mt=W[q],Ct=$[q];if(Ct===void 0&&(q==="instanceMatrix"&&b.instanceMatrix&&(Ct=b.instanceMatrix),q==="instanceColor"&&b.instanceColor&&(Ct=b.instanceColor)),Mt===void 0||Mt.attribute!==Ct||Ct&&Mt.data!==Ct.data)return!0;G++}return r.attributesNum!==G||r.index!==H}function g(b,U,V,H){let W={},$=U.attributes,G=0,rt=V.getAttributes();for(let q in rt)if(rt[q].location>=0){let Mt=$[q];Mt===void 0&&(q==="instanceMatrix"&&b.instanceMatrix&&(Mt=b.instanceMatrix),q==="instanceColor"&&b.instanceColor&&(Mt=b.instanceColor));let Ct={};Ct.attribute=Mt,Mt&&Mt.data&&(Ct.data=Mt.data),W[q]=Ct,G++}r.attributes=W,r.attributesNum=G,r.index=H}function x(){let b=r.newAttributes;for(let U=0,V=b.length;U<V;U++)b[U]=0}function m(b){l(b,0)}function l(b,U){let V=r.newAttributes,H=r.enabledAttributes,W=r.attributeDivisors;V[b]=1,H[b]===0&&(i.enableVertexAttribArray(b),H[b]=1),W[b]!==U&&(i.vertexAttribDivisor(b,U),W[b]=U)}function E(){let b=r.newAttributes,U=r.enabledAttributes;for(let V=0,H=U.length;V<H;V++)U[V]!==b[V]&&(i.disableVertexAttribArray(V),U[V]=0)}function y(b,U,V,H,W,$,G){G===!0?i.vertexAttribIPointer(b,U,V,W,$):i.vertexAttribPointer(b,U,V,H,W,$)}function v(b,U,V,H){x();let W=H.attributes,$=V.getAttributes(),G=U.defaultAttributeValues;for(let rt in $){let q=$[rt];if(q.location>=0){let ut=W[rt];if(ut===void 0&&(rt==="instanceMatrix"&&b.instanceMatrix&&(ut=b.instanceMatrix),rt==="instanceColor"&&b.instanceColor&&(ut=b.instanceColor)),ut!==void 0){let Mt=ut.normalized,Ct=ut.itemSize,Gt=t.get(ut);if(Gt===void 0)continue;let se=Gt.buffer,J=Gt.type,at=Gt.bytesPerElement,Rt=J===i.INT||J===i.UNSIGNED_INT||ut.gpuType===Aa;if(ut.isInterleavedBufferAttribute){let mt=ut.data,St=mt.stride,At=ut.offset;if(mt.isInstancedInterleavedBuffer){for(let Ft=0;Ft<q.locationSize;Ft++)l(q.location+Ft,mt.meshPerAttribute);b.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=mt.meshPerAttribute*mt.count)}else for(let Ft=0;Ft<q.locationSize;Ft++)m(q.location+Ft);i.bindBuffer(i.ARRAY_BUFFER,se);for(let Ft=0;Ft<q.locationSize;Ft++)y(q.location+Ft,Ct/q.locationSize,J,Mt,St*at,(At+Ct/q.locationSize*Ft)*at,Rt)}else{if(ut.isInstancedBufferAttribute){for(let mt=0;mt<q.locationSize;mt++)l(q.location+mt,ut.meshPerAttribute);b.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=ut.meshPerAttribute*ut.count)}else for(let mt=0;mt<q.locationSize;mt++)m(q.location+mt);i.bindBuffer(i.ARRAY_BUFFER,se);for(let mt=0;mt<q.locationSize;mt++)y(q.location+mt,Ct/q.locationSize,J,Mt,Ct*at,Ct/q.locationSize*mt*at,Rt)}}else if(G!==void 0){let Mt=G[rt];if(Mt!==void 0)switch(Mt.length){case 2:i.vertexAttrib2fv(q.location,Mt);break;case 3:i.vertexAttrib3fv(q.location,Mt);break;case 4:i.vertexAttrib4fv(q.location,Mt);break;default:i.vertexAttrib1fv(q.location,Mt)}}}}E()}function D(){N();for(let b in n){let U=n[b];for(let V in U){let H=U[V];for(let W in H)d(H[W].object),delete H[W];delete U[V]}delete n[b]}}function I(b){if(n[b.id]===void 0)return;let U=n[b.id];for(let V in U){let H=U[V];for(let W in H)d(H[W].object),delete H[W];delete U[V]}delete n[b.id]}function P(b){for(let U in n){let V=n[U];if(V[b.id]===void 0)continue;let H=V[b.id];for(let W in H)d(H[W].object),delete H[W];delete V[b.id]}}function N(){w(),o=!0,r!==s&&(r=s,h(r.object))}function w(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:N,resetDefaultState:w,dispose:D,releaseStatesOfGeometry:I,releaseStatesOfProgram:P,initAttributes:x,enableAttribute:m,disableUnusedAttributes:E}}function zf(i,t,e){let n;function s(h){n=h}function r(h,d){i.drawArrays(n,h,d),e.update(d,n,1)}function o(h,d,u){u!==0&&(i.drawArraysInstanced(n,h,d,u),e.update(d,n,u))}function a(h,d,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,h,0,d,0,u);let p=0;for(let g=0;g<u;g++)p+=d[g];e.update(p,n,1)}function c(h,d,u,f){if(u===0)return;let p=t.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<h.length;g++)o(h[g],d[g],f[g]);else{p.multiDrawArraysInstancedWEBGL(n,h,0,d,0,f,0,u);let g=0;for(let x=0;x<u;x++)g+=d[x]*f[x];e.update(g,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=c}function kf(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let P=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(P.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(P){return!(P!==rn&&n.convert(P)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(P){let N=P===Ms&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(P!==Tn&&n.convert(P)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&P!==Sn&&!N)}function c(P){if(P==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";P="mediump"}return P==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let h=e.precision!==void 0?e.precision:"highp",d=c(h);d!==h&&(console.warn("THREE.WebGLRenderer:",h,"not supported, using",d,"instead."),h=d);let u=e.logarithmicDepthBuffer===!0,f=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),p=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),l=i.getParameter(i.MAX_VERTEX_ATTRIBS),E=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),y=i.getParameter(i.MAX_VARYING_VECTORS),v=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),D=g>0,I=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:h,logarithmicDepthBuffer:u,reverseDepthBuffer:f,maxTextures:p,maxVertexTextures:g,maxTextureSize:x,maxCubemapSize:m,maxAttributes:l,maxVertexUniforms:E,maxVaryings:y,maxFragmentUniforms:v,vertexTextures:D,maxSamples:I}}function Hf(i){let t=this,e=null,n=0,s=!1,r=!1,o=new bn,a=new Jt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(u,f){let p=u.length!==0||f||n!==0||s;return s=f,n=u.length,p},this.beginShadows=function(){r=!0,d(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,f){e=d(u,f,0)},this.setState=function(u,f,p){let g=u.clippingPlanes,x=u.clipIntersection,m=u.clipShadows,l=i.get(u);if(!s||g===null||g.length===0||r&&!m)r?d(null):h();else{let E=r?0:n,y=E*4,v=l.clippingState||null;c.value=v,v=d(g,f,y,p);for(let D=0;D!==y;++D)v[D]=e[D];l.clippingState=v,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=E}};function h(){c.value!==e&&(c.value=e,c.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function d(u,f,p,g){let x=u!==null?u.length:0,m=null;if(x!==0){if(m=c.value,g!==!0||m===null){let l=p+x*4,E=f.matrixWorldInverse;a.getNormalMatrix(E),(m===null||m.length<l)&&(m=new Float32Array(l));for(let y=0,v=p;y!==x;++y,v+=4)o.copy(u[y]).applyMatrix4(E,a),o.normal.toArray(m,v),m[v+3]=o.constant}c.value=m,c.needsUpdate=!0}return t.numPlanes=x,t.numIntersection=0,m}}function Vf(i){let t=new WeakMap;function e(o,a){return a===uo?o.mapping=Ni:a===fo&&(o.mapping=Oi),o}function n(o){if(o&&o.isTexture){let a=o.mapping;if(a===uo||a===fo)if(t.has(o)){let c=t.get(o).texture;return e(c,o.mapping)}else{let c=o.image;if(c&&c.height>0){let h=new $o(c.height);return h.fromEquirectangularTexture(i,o),t.set(o,h),o.addEventListener("dispose",s),e(h.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let c=t.get(a);c!==void 0&&(t.delete(a),c.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}var hr=class extends ar{constructor(t=-1,e=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,o=n+t,a=s+e,c=s-e;if(this.view!==null&&this.view.enabled){let h=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=h*this.view.offsetX,o=r+h*this.view.width,a-=d*this.view.offsetY,c=a-d*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,c,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},Ri=4,Sc=[.125,.215,.35,.446,.526,.582],ni=20,Xr=new hr,Ec=new ie,qr=null,Yr=0,$r=0,Zr=!1,Qn=(1+Math.sqrt(5))/2,Ai=1/Qn,wc=[new L(-Qn,Ai,0),new L(Qn,Ai,0),new L(-Ai,0,Qn),new L(Ai,0,Qn),new L(0,Qn,-Ai),new L(0,Qn,Ai),new L(-1,1,-1),new L(1,1,-1),new L(-1,1,1),new L(1,1,1)],Vn=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){qr=this._renderer.getRenderTarget(),Yr=this._renderer.getActiveCubeFace(),$r=this._renderer.getActiveMipmapLevel(),Zr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Cc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ac(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(qr,Yr,$r),this._renderer.xr.enabled=Zr,t.scissorTest=!1,Ws(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Ni||t.mapping===Oi?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),qr=this._renderer.getRenderTarget(),Yr=this._renderer.getActiveCubeFace(),$r=this._renderer.getActiveMipmapLevel(),Zr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:dn,minFilter:dn,generateMipmaps:!1,type:Ms,format:rn,colorSpace:Yi,depthBuffer:!1},s=Tc(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Tc(t,e,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Gf(r)),this._blurMaterial=Wf(r,t,e)}return s}_compileMaterial(t){let e=new Yt(this._lodPlanes[0],t);this._renderer.compile(e,Xr)}_sceneToCubeUV(t,e,n,s){let a=new Re(90,1,e,n),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],d=this._renderer,u=d.autoClear,f=d.toneMapping;d.getClearColor(Ec),d.toneMapping=Bn,d.autoClear=!1;let p=new ke({name:"PMREM.Background",side:Ue,depthWrite:!1,depthTest:!1}),g=new Yt(new ci,p),x=!1,m=t.background;m?m.isColor&&(p.color.copy(m),t.background=null,x=!0):(p.color.copy(Ec),x=!0);for(let l=0;l<6;l++){let E=l%3;E===0?(a.up.set(0,c[l],0),a.lookAt(h[l],0,0)):E===1?(a.up.set(0,0,c[l]),a.lookAt(0,h[l],0)):(a.up.set(0,c[l],0),a.lookAt(0,0,h[l]));let y=this._cubeSize;Ws(s,E*y,l>2?y:0,y,y),d.setRenderTarget(s),x&&d.render(g,a),d.render(t,a)}g.geometry.dispose(),g.material.dispose(),d.toneMapping=f,d.autoClear=u,t.background=m}_textureToCubeUV(t,e){let n=this._renderer,s=t.mapping===Ni||t.mapping===Oi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Cc()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ac());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new Yt(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=t;let c=this._cubeSize;Ws(e,0,0,3*c,2*c),n.setRenderTarget(e),n.render(o,Xr)}_applyPMREM(t){let e=this._renderer,n=e.autoClear;e.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=wc[(s-r-1)%wc.length];this._blur(t,r-1,r,o,a)}e.autoClear=n}_blur(t,e,n,s,r){let o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,s,"latitudinal",r),this._halfBlur(o,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,o,a){let c=this._renderer,h=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let d=3,u=new Yt(this._lodPlanes[s],h),f=h.uniforms,p=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*p):2*Math.PI/(2*ni-1),x=r/g,m=isFinite(r)?1+Math.floor(d*x):ni;m>ni&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${ni}`);let l=[],E=0;for(let P=0;P<ni;++P){let N=P/x,w=Math.exp(-N*N/2);l.push(w),P===0?E+=w:P<m&&(E+=2*w)}for(let P=0;P<l.length;P++)l[P]=l[P]/E;f.envMap.value=t.texture,f.samples.value=m,f.weights.value=l,f.latitudinal.value=o==="latitudinal",a&&(f.poleAxis.value=a);let{_lodMax:y}=this;f.dTheta.value=g,f.mipInt.value=y-n;let v=this._sizeLods[s],D=3*v*(s>y-Ri?s-y+Ri:0),I=4*(this._cubeSize-v);Ws(e,D,I,3*v,2*v),c.setRenderTarget(e),c.render(u,Xr)}};function Gf(i){let t=[],e=[],n=[],s=i,r=i-Ri+1+Sc.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);e.push(a);let c=1/a;o>i-Ri?c=Sc[o-i+Ri-1]:o===0&&(c=0),n.push(c);let h=1/(a-2),d=-h,u=1+h,f=[d,d,u,d,u,u,d,d,u,u,d,u],p=6,g=6,x=3,m=2,l=1,E=new Float32Array(x*g*p),y=new Float32Array(m*g*p),v=new Float32Array(l*g*p);for(let I=0;I<p;I++){let P=I%3*2/3-1,N=I>2?0:-1,w=[P,N,0,P+2/3,N,0,P+2/3,N+1,0,P,N,0,P+2/3,N+1,0,P,N+1,0];E.set(w,x*g*I),y.set(f,m*g*I);let b=[I,I,I,I,I,I];v.set(b,l*g*I)}let D=new He;D.setAttribute("position",new Ze(E,x)),D.setAttribute("uv",new Ze(y,m)),D.setAttribute("faceIndex",new Ze(v,l)),t.push(D),s>Ri&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function Tc(i,t,e){let n=new An(i,t,e);return n.texture.mapping=gr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ws(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function Wf(i,t,e){let n=new Float32Array(ni),s=new L(0,1,0);return new pn({name:"SphericalGaussianBlur",defines:{n:ni,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Ua(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Fn,depthTest:!1,depthWrite:!1})}function Ac(){return new pn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ua(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Fn,depthTest:!1,depthWrite:!1})}function Cc(){return new pn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ua(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Fn,depthTest:!1,depthWrite:!1})}function Ua(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Xf(i){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){let c=a.mapping,h=c===uo||c===fo,d=c===Ni||c===Oi;if(h||d){let u=t.get(a),f=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==f)return e===null&&(e=new Vn(i)),u=h?e.fromEquirectangular(a,u):e.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,t.set(a,u),u.texture;if(u!==void 0)return u.texture;{let p=a.image;return h&&p&&p.height>0||d&&p&&s(p)?(e===null&&(e=new Vn(i)),u=h?e.fromEquirectangular(a):e.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,t.set(a,u),a.addEventListener("dispose",r),u.texture):null}}}return a}function s(a){let c=0,h=6;for(let d=0;d<h;d++)a[d]!==void 0&&c++;return c===h}function r(a){let c=a.target;c.removeEventListener("dispose",r);let h=t.get(c);h!==void 0&&(t.delete(c),h.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function qf(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let s=e(n);return s===null&&cs("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function Yf(i,t,e,n){let s={},r=new WeakMap;function o(u){let f=u.target;f.index!==null&&t.remove(f.index);for(let g in f.attributes)t.remove(f.attributes[g]);for(let g in f.morphAttributes){let x=f.morphAttributes[g];for(let m=0,l=x.length;m<l;m++)t.remove(x[m])}f.removeEventListener("dispose",o),delete s[f.id];let p=r.get(f);p&&(t.remove(p),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,e.memory.geometries--}function a(u,f){return s[f.id]===!0||(f.addEventListener("dispose",o),s[f.id]=!0,e.memory.geometries++),f}function c(u){let f=u.attributes;for(let g in f)t.update(f[g],i.ARRAY_BUFFER);let p=u.morphAttributes;for(let g in p){let x=p[g];for(let m=0,l=x.length;m<l;m++)t.update(x[m],i.ARRAY_BUFFER)}}function h(u){let f=[],p=u.index,g=u.attributes.position,x=0;if(p!==null){let E=p.array;x=p.version;for(let y=0,v=E.length;y<v;y+=3){let D=E[y+0],I=E[y+1],P=E[y+2];f.push(D,I,I,P,P,D)}}else if(g!==void 0){let E=g.array;x=g.version;for(let y=0,v=E.length/3-1;y<v;y+=3){let D=y+0,I=y+1,P=y+2;f.push(D,I,I,P,P,D)}}else return;let m=new(dl(f)?or:rr)(f,1);m.version=x;let l=r.get(u);l&&t.remove(l),r.set(u,m)}function d(u){let f=r.get(u);if(f){let p=u.index;p!==null&&f.version<p.version&&h(u)}else h(u);return r.get(u)}return{get:a,update:c,getWireframeAttribute:d}}function $f(i,t,e){let n;function s(f){n=f}let r,o;function a(f){r=f.type,o=f.bytesPerElement}function c(f,p){i.drawElements(n,p,r,f*o),e.update(p,n,1)}function h(f,p,g){g!==0&&(i.drawElementsInstanced(n,p,r,f*o,g),e.update(p,n,g))}function d(f,p,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,p,0,r,f,0,g);let m=0;for(let l=0;l<g;l++)m+=p[l];e.update(m,n,1)}function u(f,p,g,x){if(g===0)return;let m=t.get("WEBGL_multi_draw");if(m===null)for(let l=0;l<f.length;l++)h(f[l]/o,p[l],x[l]);else{m.multiDrawElementsInstancedWEBGL(n,p,0,r,f,0,x,0,g);let l=0;for(let E=0;E<g;E++)l+=p[E]*x[E];e.update(l,n,1)}}this.setMode=s,this.setIndex=a,this.render=c,this.renderInstances=h,this.renderMultiDraw=d,this.renderMultiDrawInstances=u}function Zf(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(r/3);break;case i.LINES:e.lines+=a*(r/2);break;case i.LINE_STRIP:e.lines+=a*(r-1);break;case i.LINE_LOOP:e.lines+=a*r;break;case i.POINTS:e.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function Jf(i,t,e){let n=new WeakMap,s=new pe;function r(o,a,c){let h=o.morphTargetInfluences,d=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=d!==void 0?d.length:0,f=n.get(a);if(f===void 0||f.count!==u){let w=function(){P.dispose(),n.delete(a),a.removeEventListener("dispose",w)};f!==void 0&&f.texture.dispose();let p=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,x=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],l=a.morphAttributes.normal||[],E=a.morphAttributes.color||[],y=0;p===!0&&(y=1),g===!0&&(y=2),x===!0&&(y=3);let v=a.attributes.position.count*y,D=1;v>t.maxTextureSize&&(D=Math.ceil(v/t.maxTextureSize),v=t.maxTextureSize);let I=new Float32Array(v*D*4*u),P=new ir(I,v,D,u);P.type=Sn,P.needsUpdate=!0;let N=y*4;for(let b=0;b<u;b++){let U=m[b],V=l[b],H=E[b],W=v*D*4*b;for(let $=0;$<U.count;$++){let G=$*N;p===!0&&(s.fromBufferAttribute(U,$),I[W+G+0]=s.x,I[W+G+1]=s.y,I[W+G+2]=s.z,I[W+G+3]=0),g===!0&&(s.fromBufferAttribute(V,$),I[W+G+4]=s.x,I[W+G+5]=s.y,I[W+G+6]=s.z,I[W+G+7]=0),x===!0&&(s.fromBufferAttribute(H,$),I[W+G+8]=s.x,I[W+G+9]=s.y,I[W+G+10]=s.z,I[W+G+11]=H.itemSize===4?s.w:1)}}f={count:u,texture:P,size:new kt(v,D)},n.set(a,f),a.addEventListener("dispose",w)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",o.morphTexture,e);else{let p=0;for(let x=0;x<h.length;x++)p+=h[x];let g=a.morphTargetsRelative?1:1-p;c.getUniforms().setValue(i,"morphTargetBaseInfluence",g),c.getUniforms().setValue(i,"morphTargetInfluences",h)}c.getUniforms().setValue(i,"morphTargetsTexture",f.texture,e),c.getUniforms().setValue(i,"morphTargetsTextureSize",f.size)}return{update:r}}function Kf(i,t,e,n){let s=new WeakMap;function r(c){let h=n.render.frame,d=c.geometry,u=t.get(c,d);if(s.get(u)!==h&&(t.update(u),s.set(u,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",a)===!1&&c.addEventListener("dispose",a),s.get(c)!==h&&(e.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,i.ARRAY_BUFFER),s.set(c,h))),c.isSkinnedMesh){let f=c.skeleton;s.get(f)!==h&&(f.update(),s.set(f,h))}return u}function o(){s=new WeakMap}function a(c){let h=c.target;h.removeEventListener("dispose",a),e.remove(h.instanceMatrix),h.instanceColor!==null&&e.remove(h.instanceColor)}return{update:r,dispose:o}}var ur=class extends Je{constructor(t,e,n,s,r,o,a,c,h,d=Pi){if(d!==Pi&&d!==Bi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&d===Pi&&(n=ri),n===void 0&&d===Bi&&(n=Fi),super(null,s,r,o,a,c,d,n,h),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:on,this.minFilter=c!==void 0?c:on,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},gl=new Je,Rc=new ur(1,1),xl=new ir,_l=new Xo,yl=new cr,Ic=[],Pc=[],Lc=new Float32Array(16),Dc=new Float32Array(9),Uc=new Float32Array(4);function Zi(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=Ic[s];if(r===void 0&&(r=new Float32Array(s),Ic[s]=r),t!==0){n.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(r,a)}return r}function Se(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Ee(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function _r(i,t){let e=Pc[t];e===void 0&&(e=new Int32Array(t),Pc[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function jf(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function Qf(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Se(e,t))return;i.uniform2fv(this.addr,t),Ee(e,t)}}function tp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Se(e,t))return;i.uniform3fv(this.addr,t),Ee(e,t)}}function ep(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Se(e,t))return;i.uniform4fv(this.addr,t),Ee(e,t)}}function np(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Se(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Ee(e,t)}else{if(Se(e,n))return;Uc.set(n),i.uniformMatrix2fv(this.addr,!1,Uc),Ee(e,n)}}function ip(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Se(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Ee(e,t)}else{if(Se(e,n))return;Dc.set(n),i.uniformMatrix3fv(this.addr,!1,Dc),Ee(e,n)}}function sp(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Se(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Ee(e,t)}else{if(Se(e,n))return;Lc.set(n),i.uniformMatrix4fv(this.addr,!1,Lc),Ee(e,n)}}function rp(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function op(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Se(e,t))return;i.uniform2iv(this.addr,t),Ee(e,t)}}function ap(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Se(e,t))return;i.uniform3iv(this.addr,t),Ee(e,t)}}function cp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Se(e,t))return;i.uniform4iv(this.addr,t),Ee(e,t)}}function lp(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function hp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Se(e,t))return;i.uniform2uiv(this.addr,t),Ee(e,t)}}function up(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Se(e,t))return;i.uniform3uiv(this.addr,t),Ee(e,t)}}function dp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Se(e,t))return;i.uniform4uiv(this.addr,t),Ee(e,t)}}function fp(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Rc.compareFunction=ul,r=Rc):r=gl,e.setTexture2D(t||r,s)}function pp(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||_l,s)}function mp(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||yl,s)}function gp(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||xl,s)}function xp(i){switch(i){case 5126:return jf;case 35664:return Qf;case 35665:return tp;case 35666:return ep;case 35674:return np;case 35675:return ip;case 35676:return sp;case 5124:case 35670:return rp;case 35667:case 35671:return op;case 35668:case 35672:return ap;case 35669:case 35673:return cp;case 5125:return lp;case 36294:return hp;case 36295:return up;case 36296:return dp;case 35678:case 36198:case 36298:case 36306:case 35682:return fp;case 35679:case 36299:case 36307:return pp;case 35680:case 36300:case 36308:case 36293:return mp;case 36289:case 36303:case 36311:case 36292:return gp}}function _p(i,t){i.uniform1fv(this.addr,t)}function yp(i,t){let e=Zi(t,this.size,2);i.uniform2fv(this.addr,e)}function vp(i,t){let e=Zi(t,this.size,3);i.uniform3fv(this.addr,e)}function Mp(i,t){let e=Zi(t,this.size,4);i.uniform4fv(this.addr,e)}function bp(i,t){let e=Zi(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Sp(i,t){let e=Zi(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Ep(i,t){let e=Zi(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function wp(i,t){i.uniform1iv(this.addr,t)}function Tp(i,t){i.uniform2iv(this.addr,t)}function Ap(i,t){i.uniform3iv(this.addr,t)}function Cp(i,t){i.uniform4iv(this.addr,t)}function Rp(i,t){i.uniform1uiv(this.addr,t)}function Ip(i,t){i.uniform2uiv(this.addr,t)}function Pp(i,t){i.uniform3uiv(this.addr,t)}function Lp(i,t){i.uniform4uiv(this.addr,t)}function Dp(i,t,e){let n=this.cache,s=t.length,r=_r(e,s);Se(n,r)||(i.uniform1iv(this.addr,r),Ee(n,r));for(let o=0;o!==s;++o)e.setTexture2D(t[o]||gl,r[o])}function Up(i,t,e){let n=this.cache,s=t.length,r=_r(e,s);Se(n,r)||(i.uniform1iv(this.addr,r),Ee(n,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||_l,r[o])}function Np(i,t,e){let n=this.cache,s=t.length,r=_r(e,s);Se(n,r)||(i.uniform1iv(this.addr,r),Ee(n,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||yl,r[o])}function Op(i,t,e){let n=this.cache,s=t.length,r=_r(e,s);Se(n,r)||(i.uniform1iv(this.addr,r),Ee(n,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||xl,r[o])}function Fp(i){switch(i){case 5126:return _p;case 35664:return yp;case 35665:return vp;case 35666:return Mp;case 35674:return bp;case 35675:return Sp;case 35676:return Ep;case 5124:case 35670:return wp;case 35667:case 35671:return Tp;case 35668:case 35672:return Ap;case 35669:case 35673:return Cp;case 5125:return Rp;case 36294:return Ip;case 36295:return Pp;case 36296:return Lp;case 35678:case 36198:case 36298:case 36306:case 35682:return Dp;case 35679:case 36299:case 36307:return Up;case 35680:case 36300:case 36308:case 36293:return Np;case 36289:case 36303:case 36311:case 36292:return Op}}var Zo=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=xp(e.type)}},Jo=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Fp(e.type)}},Ko=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(t,e[a.id],n)}}},Jr=/(\w+)(\])?(\[|\.)?/g;function Nc(i,t){i.seq.push(t),i.map[t.id]=t}function Bp(i,t,e){let n=i.name,s=n.length;for(Jr.lastIndex=0;;){let r=Jr.exec(n),o=Jr.lastIndex,a=r[1],c=r[2]==="]",h=r[3];if(c&&(a=a|0),h===void 0||h==="["&&o+2===s){Nc(e,h===void 0?new Zo(a,i,t):new Jo(a,i,t));break}else{let u=e.map[a];u===void 0&&(u=new Ko(a),Nc(e,u)),e=u}}}var Di=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=t.getActiveUniform(e,s),o=t.getUniformLocation(e,r.name);Bp(r,o,this)}}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,o=e.length;r!==o;++r){let a=e[r],c=n[a.id];c.needsUpdate!==!1&&a.setValue(t,c.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let o=t[s];o.id in e&&n.push(o)}return n}};function Oc(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var zp=37297,kp=0;function Hp(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){let a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}var Fc=new Jt;function Vp(i){oe._getMatrix(Fc,oe.workingColorSpace,i);let t=`mat3( ${Fc.elements.map(e=>e.toFixed(4))} )`;switch(oe.getTransfer(i)){case xr:return[t,"LinearTransferOETF"];case fe:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function Bc(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let o=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+Hp(i.getShaderSource(t),o)}else return s}function Gp(i,t){let e=Vp(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function Wp(i,t){let e;switch(t){case th:e="Linear";break;case eh:e="Reinhard";break;case nh:e="Cineon";break;case ih:e="ACESFilmic";break;case rh:e="AgX";break;case vs:e="Neutral";break;case sh:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var Xs=new L;function Xp(){oe.getLuminanceCoefficients(Xs);let i=Xs.x.toFixed(4),t=Xs.y.toFixed(4),e=Xs.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function qp(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ls).join(`
`)}function Yp(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function $p(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),o=r.name,a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function ls(i){return i!==""}function zc(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function kc(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Zp=/^[ \t]*#include +<([\w\d./]+)>/gm;function jo(i){return i.replace(Zp,Kp)}var Jp=new Map;function Kp(i,t){let e=Qt[t];if(e===void 0){let n=Jp.get(t);if(n!==void 0)e=Qt[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return jo(e)}var jp=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Hc(i){return i.replace(jp,Qp)}function Qp(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Vc(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function tm(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Kc?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===Dl?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Mn&&(t="SHADOWMAP_TYPE_VSM"),t}function em(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Ni:case Oi:t="ENVMAP_TYPE_CUBE";break;case gr:t="ENVMAP_TYPE_CUBE_UV";break}return t}function nm(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case Oi:t="ENVMAP_MODE_REFRACTION";break}return t}function im(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case jc:t="ENVMAP_BLENDING_MULTIPLY";break;case jl:t="ENVMAP_BLENDING_MIX";break;case Ql:t="ENVMAP_BLENDING_ADD";break}return t}function sm(i){let t=i.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function rm(i,t,e,n){let s=i.getContext(),r=e.defines,o=e.vertexShader,a=e.fragmentShader,c=tm(e),h=em(e),d=nm(e),u=im(e),f=sm(e),p=qp(e),g=Yp(r),x=s.createProgram(),m,l,E=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(ls).join(`
`),m.length>0&&(m+=`
`),l=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(ls).join(`
`),l.length>0&&(l+=`
`)):(m=[Vc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+d:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ls).join(`
`),l=[Vc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.envMap?"#define "+d:"",e.envMap?"#define "+u:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Bn?"#define TONE_MAPPING":"",e.toneMapping!==Bn?Qt.tonemapping_pars_fragment:"",e.toneMapping!==Bn?Wp("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Qt.colorspace_pars_fragment,Gp("linearToOutputTexel",e.outputColorSpace),Xp(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(ls).join(`
`)),o=jo(o),o=zc(o,e),o=kc(o,e),a=jo(a),a=zc(a,e),a=kc(a,e),o=Hc(o),a=Hc(a),e.isRawShaderMaterial!==!0&&(E=`#version 300 es
`,m=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,l=["#define varying in",e.glslVersion===ec?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===ec?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+l);let y=E+m+o,v=E+l+a,D=Oc(s,s.VERTEX_SHADER,y),I=Oc(s,s.FRAGMENT_SHADER,v);s.attachShader(x,D),s.attachShader(x,I),e.index0AttributeName!==void 0?s.bindAttribLocation(x,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(x,0,"position"),s.linkProgram(x);function P(U){if(i.debug.checkShaderErrors){let V=s.getProgramInfoLog(x).trim(),H=s.getShaderInfoLog(D).trim(),W=s.getShaderInfoLog(I).trim(),$=!0,G=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if($=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,x,D,I);else{let rt=Bc(s,D,"vertex"),q=Bc(s,I,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+U.name+`
Material Type: `+U.type+`

Program Info Log: `+V+`
`+rt+`
`+q)}else V!==""?console.warn("THREE.WebGLProgram: Program Info Log:",V):(H===""||W==="")&&(G=!1);G&&(U.diagnostics={runnable:$,programLog:V,vertexShader:{log:H,prefix:m},fragmentShader:{log:W,prefix:l}})}s.deleteShader(D),s.deleteShader(I),N=new Di(s,x),w=$p(s,x)}let N;this.getUniforms=function(){return N===void 0&&P(this),N};let w;this.getAttributes=function(){return w===void 0&&P(this),w};let b=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return b===!1&&(b=s.getProgramParameter(x,zp)),b},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=kp++,this.cacheKey=t,this.usedTimes=1,this.program=x,this.vertexShader=D,this.fragmentShader=I,this}var om=0,Qo=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){let e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new ta(t),e.set(t,n)),n}},ta=class{constructor(t){this.id=om++,this.code=t,this.usedTimes=0}};function am(i,t,e,n,s,r,o){let a=new sr,c=new Qo,h=new Set,d=[],u=s.logarithmicDepthBuffer,f=s.vertexTextures,p=s.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(w){return h.add(w),w===0?"uv":`uv${w}`}function m(w,b,U,V,H){let W=V.fog,$=H.geometry,G=w.isMeshStandardMaterial?V.environment:null,rt=(w.isMeshStandardMaterial?e:t).get(w.envMap||G),q=rt&&rt.mapping===gr?rt.image.height:null,ut=g[w.type];w.precision!==null&&(p=s.getMaxPrecision(w.precision),p!==w.precision&&console.warn("THREE.WebGLProgram.getParameters:",w.precision,"not supported, using",p,"instead."));let Mt=$.morphAttributes.position||$.morphAttributes.normal||$.morphAttributes.color,Ct=Mt!==void 0?Mt.length:0,Gt=0;$.morphAttributes.position!==void 0&&(Gt=1),$.morphAttributes.normal!==void 0&&(Gt=2),$.morphAttributes.color!==void 0&&(Gt=3);let se,J,at,Rt;if(ut){let ne=un[ut];se=ne.vertexShader,J=ne.fragmentShader}else se=w.vertexShader,J=w.fragmentShader,c.update(w),at=c.getVertexShaderID(w),Rt=c.getFragmentShaderID(w);let mt=i.getRenderTarget(),St=i.state.buffers.depth.getReversed(),At=H.isInstancedMesh===!0,Ft=H.isBatchedMesh===!0,ae=!!w.map,Dt=!!w.matcap,te=!!rt,B=!!w.aoMap,we=!!w.lightMap,Kt=!!w.bumpMap,$t=!!w.normalMap,Ut=!!w.displacementMap,ce=!!w.emissiveMap,It=!!w.metalnessMap,R=!!w.roughnessMap,M=w.anisotropy>0,k=w.clearcoat>0,j=w.dispersion>0,nt=w.iridescence>0,K=w.sheen>0,lt=w.transmission>0,dt=M&&!!w.anisotropyMap,vt=k&&!!w.clearcoatMap,Zt=k&&!!w.clearcoatNormalMap,ot=k&&!!w.clearcoatRoughnessMap,ht=nt&&!!w.iridescenceMap,Tt=nt&&!!w.iridescenceThicknessMap,Bt=K&&!!w.sheenColorMap,ct=K&&!!w.sheenRoughnessMap,Wt=!!w.specularMap,Nt=!!w.specularColorMap,Et=!!w.specularIntensityMap,F=lt&&!!w.transmissionMap,ft=lt&&!!w.thicknessMap,X=!!w.gradientMap,Q=!!w.alphaMap,gt=w.alphaTest>0,xt=!!w.alphaHash,zt=!!w.extensions,ue=Bn;w.toneMapped&&(mt===null||mt.isXRRenderTarget===!0)&&(ue=i.toneMapping);let ve={shaderID:ut,shaderType:w.type,shaderName:w.name,vertexShader:se,fragmentShader:J,defines:w.defines,customVertexShaderID:at,customFragmentShaderID:Rt,isRawShaderMaterial:w.isRawShaderMaterial===!0,glslVersion:w.glslVersion,precision:p,batching:Ft,batchingColor:Ft&&H._colorsTexture!==null,instancing:At,instancingColor:At&&H.instanceColor!==null,instancingMorph:At&&H.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:mt===null?i.outputColorSpace:mt.isXRRenderTarget===!0?mt.texture.colorSpace:Yi,alphaToCoverage:!!w.alphaToCoverage,map:ae,matcap:Dt,envMap:te,envMapMode:te&&rt.mapping,envMapCubeUVHeight:q,aoMap:B,lightMap:we,bumpMap:Kt,normalMap:$t,displacementMap:f&&Ut,emissiveMap:ce,normalMapObjectSpace:$t&&w.normalMapType===lh,normalMapTangentSpace:$t&&w.normalMapType===hl,metalnessMap:It,roughnessMap:R,anisotropy:M,anisotropyMap:dt,clearcoat:k,clearcoatMap:vt,clearcoatNormalMap:Zt,clearcoatRoughnessMap:ot,dispersion:j,iridescence:nt,iridescenceMap:ht,iridescenceThicknessMap:Tt,sheen:K,sheenColorMap:Bt,sheenRoughnessMap:ct,specularMap:Wt,specularColorMap:Nt,specularIntensityMap:Et,transmission:lt,transmissionMap:F,thicknessMap:ft,gradientMap:X,opaque:w.transparent===!1&&w.blending===Ii&&w.alphaToCoverage===!1,alphaMap:Q,alphaTest:gt,alphaHash:xt,combine:w.combine,mapUv:ae&&x(w.map.channel),aoMapUv:B&&x(w.aoMap.channel),lightMapUv:we&&x(w.lightMap.channel),bumpMapUv:Kt&&x(w.bumpMap.channel),normalMapUv:$t&&x(w.normalMap.channel),displacementMapUv:Ut&&x(w.displacementMap.channel),emissiveMapUv:ce&&x(w.emissiveMap.channel),metalnessMapUv:It&&x(w.metalnessMap.channel),roughnessMapUv:R&&x(w.roughnessMap.channel),anisotropyMapUv:dt&&x(w.anisotropyMap.channel),clearcoatMapUv:vt&&x(w.clearcoatMap.channel),clearcoatNormalMapUv:Zt&&x(w.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ot&&x(w.clearcoatRoughnessMap.channel),iridescenceMapUv:ht&&x(w.iridescenceMap.channel),iridescenceThicknessMapUv:Tt&&x(w.iridescenceThicknessMap.channel),sheenColorMapUv:Bt&&x(w.sheenColorMap.channel),sheenRoughnessMapUv:ct&&x(w.sheenRoughnessMap.channel),specularMapUv:Wt&&x(w.specularMap.channel),specularColorMapUv:Nt&&x(w.specularColorMap.channel),specularIntensityMapUv:Et&&x(w.specularIntensityMap.channel),transmissionMapUv:F&&x(w.transmissionMap.channel),thicknessMapUv:ft&&x(w.thicknessMap.channel),alphaMapUv:Q&&x(w.alphaMap.channel),vertexTangents:!!$.attributes.tangent&&($t||M),vertexColors:w.vertexColors,vertexAlphas:w.vertexColors===!0&&!!$.attributes.color&&$.attributes.color.itemSize===4,pointsUvs:H.isPoints===!0&&!!$.attributes.uv&&(ae||Q),fog:!!W,useFog:w.fog===!0,fogExp2:!!W&&W.isFogExp2,flatShading:w.flatShading===!0,sizeAttenuation:w.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:St,skinning:H.isSkinnedMesh===!0,morphTargets:$.morphAttributes.position!==void 0,morphNormals:$.morphAttributes.normal!==void 0,morphColors:$.morphAttributes.color!==void 0,morphTargetsCount:Ct,morphTextureStride:Gt,numDirLights:b.directional.length,numPointLights:b.point.length,numSpotLights:b.spot.length,numSpotLightMaps:b.spotLightMap.length,numRectAreaLights:b.rectArea.length,numHemiLights:b.hemi.length,numDirLightShadows:b.directionalShadowMap.length,numPointLightShadows:b.pointShadowMap.length,numSpotLightShadows:b.spotShadowMap.length,numSpotLightShadowsWithMaps:b.numSpotLightShadowsWithMaps,numLightProbes:b.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:w.dithering,shadowMapEnabled:i.shadowMap.enabled&&U.length>0,shadowMapType:i.shadowMap.type,toneMapping:ue,decodeVideoTexture:ae&&w.map.isVideoTexture===!0&&oe.getTransfer(w.map.colorSpace)===fe,decodeVideoTextureEmissive:ce&&w.emissiveMap.isVideoTexture===!0&&oe.getTransfer(w.emissiveMap.colorSpace)===fe,premultipliedAlpha:w.premultipliedAlpha,doubleSided:w.side===sn,flipSided:w.side===Ue,useDepthPacking:w.depthPacking>=0,depthPacking:w.depthPacking||0,index0AttributeName:w.index0AttributeName,extensionClipCullDistance:zt&&w.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(zt&&w.extensions.multiDraw===!0||Ft)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:w.customProgramCacheKey()};return ve.vertexUv1s=h.has(1),ve.vertexUv2s=h.has(2),ve.vertexUv3s=h.has(3),h.clear(),ve}function l(w){let b=[];if(w.shaderID?b.push(w.shaderID):(b.push(w.customVertexShaderID),b.push(w.customFragmentShaderID)),w.defines!==void 0)for(let U in w.defines)b.push(U),b.push(w.defines[U]);return w.isRawShaderMaterial===!1&&(E(b,w),y(b,w),b.push(i.outputColorSpace)),b.push(w.customProgramCacheKey),b.join()}function E(w,b){w.push(b.precision),w.push(b.outputColorSpace),w.push(b.envMapMode),w.push(b.envMapCubeUVHeight),w.push(b.mapUv),w.push(b.alphaMapUv),w.push(b.lightMapUv),w.push(b.aoMapUv),w.push(b.bumpMapUv),w.push(b.normalMapUv),w.push(b.displacementMapUv),w.push(b.emissiveMapUv),w.push(b.metalnessMapUv),w.push(b.roughnessMapUv),w.push(b.anisotropyMapUv),w.push(b.clearcoatMapUv),w.push(b.clearcoatNormalMapUv),w.push(b.clearcoatRoughnessMapUv),w.push(b.iridescenceMapUv),w.push(b.iridescenceThicknessMapUv),w.push(b.sheenColorMapUv),w.push(b.sheenRoughnessMapUv),w.push(b.specularMapUv),w.push(b.specularColorMapUv),w.push(b.specularIntensityMapUv),w.push(b.transmissionMapUv),w.push(b.thicknessMapUv),w.push(b.combine),w.push(b.fogExp2),w.push(b.sizeAttenuation),w.push(b.morphTargetsCount),w.push(b.morphAttributeCount),w.push(b.numDirLights),w.push(b.numPointLights),w.push(b.numSpotLights),w.push(b.numSpotLightMaps),w.push(b.numHemiLights),w.push(b.numRectAreaLights),w.push(b.numDirLightShadows),w.push(b.numPointLightShadows),w.push(b.numSpotLightShadows),w.push(b.numSpotLightShadowsWithMaps),w.push(b.numLightProbes),w.push(b.shadowMapType),w.push(b.toneMapping),w.push(b.numClippingPlanes),w.push(b.numClipIntersection),w.push(b.depthPacking)}function y(w,b){a.disableAll(),b.supportsVertexTextures&&a.enable(0),b.instancing&&a.enable(1),b.instancingColor&&a.enable(2),b.instancingMorph&&a.enable(3),b.matcap&&a.enable(4),b.envMap&&a.enable(5),b.normalMapObjectSpace&&a.enable(6),b.normalMapTangentSpace&&a.enable(7),b.clearcoat&&a.enable(8),b.iridescence&&a.enable(9),b.alphaTest&&a.enable(10),b.vertexColors&&a.enable(11),b.vertexAlphas&&a.enable(12),b.vertexUv1s&&a.enable(13),b.vertexUv2s&&a.enable(14),b.vertexUv3s&&a.enable(15),b.vertexTangents&&a.enable(16),b.anisotropy&&a.enable(17),b.alphaHash&&a.enable(18),b.batching&&a.enable(19),b.dispersion&&a.enable(20),b.batchingColor&&a.enable(21),w.push(a.mask),a.disableAll(),b.fog&&a.enable(0),b.useFog&&a.enable(1),b.flatShading&&a.enable(2),b.logarithmicDepthBuffer&&a.enable(3),b.reverseDepthBuffer&&a.enable(4),b.skinning&&a.enable(5),b.morphTargets&&a.enable(6),b.morphNormals&&a.enable(7),b.morphColors&&a.enable(8),b.premultipliedAlpha&&a.enable(9),b.shadowMapEnabled&&a.enable(10),b.doubleSided&&a.enable(11),b.flipSided&&a.enable(12),b.useDepthPacking&&a.enable(13),b.dithering&&a.enable(14),b.transmission&&a.enable(15),b.sheen&&a.enable(16),b.opaque&&a.enable(17),b.pointsUvs&&a.enable(18),b.decodeVideoTexture&&a.enable(19),b.decodeVideoTextureEmissive&&a.enable(20),b.alphaToCoverage&&a.enable(21),w.push(a.mask)}function v(w){let b=g[w.type],U;if(b){let V=un[b];U=Jh.clone(V.uniforms)}else U=w.uniforms;return U}function D(w,b){let U;for(let V=0,H=d.length;V<H;V++){let W=d[V];if(W.cacheKey===b){U=W,++U.usedTimes;break}}return U===void 0&&(U=new rm(i,b,w,r),d.push(U)),U}function I(w){if(--w.usedTimes===0){let b=d.indexOf(w);d[b]=d[d.length-1],d.pop(),w.destroy()}}function P(w){c.remove(w)}function N(){c.dispose()}return{getParameters:m,getProgramCacheKey:l,getUniforms:v,acquireProgram:D,releaseProgram:I,releaseShaderCache:P,programs:d,dispose:N}}function cm(){let i=new WeakMap;function t(o){return i.has(o)}function e(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,c){i.get(o)[a]=c}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function lm(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function Gc(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Wc(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function o(u,f,p,g,x,m){let l=i[t];return l===void 0?(l={id:u.id,object:u,geometry:f,material:p,groupOrder:g,renderOrder:u.renderOrder,z:x,group:m},i[t]=l):(l.id=u.id,l.object=u,l.geometry=f,l.material=p,l.groupOrder=g,l.renderOrder=u.renderOrder,l.z=x,l.group=m),t++,l}function a(u,f,p,g,x,m){let l=o(u,f,p,g,x,m);p.transmission>0?n.push(l):p.transparent===!0?s.push(l):e.push(l)}function c(u,f,p,g,x,m){let l=o(u,f,p,g,x,m);p.transmission>0?n.unshift(l):p.transparent===!0?s.unshift(l):e.unshift(l)}function h(u,f){e.length>1&&e.sort(u||lm),n.length>1&&n.sort(f||Gc),s.length>1&&s.sort(f||Gc)}function d(){for(let u=t,f=i.length;u<f;u++){let p=i[u];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:a,unshift:c,finish:d,sort:h}}function hm(){let i=new WeakMap;function t(n,s){let r=i.get(n),o;return r===void 0?(o=new Wc,i.set(n,[o])):s>=r.length?(o=new Wc,r.push(o)):o=r[s],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function um(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new L,color:new ie};break;case"SpotLight":e={position:new L,direction:new L,color:new ie,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new L,color:new ie,distance:0,decay:0};break;case"HemisphereLight":e={direction:new L,skyColor:new ie,groundColor:new ie};break;case"RectAreaLight":e={color:new ie,position:new L,halfWidth:new L,halfHeight:new L};break}return i[t.id]=e,e}}}function dm(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new kt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new kt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new kt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var fm=0;function pm(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function mm(i){let t=new um,e=dm(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)n.probe.push(new L);let s=new L,r=new _e,o=new _e;function a(h){let d=0,u=0,f=0;for(let w=0;w<9;w++)n.probe[w].set(0,0,0);let p=0,g=0,x=0,m=0,l=0,E=0,y=0,v=0,D=0,I=0,P=0;h.sort(pm);for(let w=0,b=h.length;w<b;w++){let U=h[w],V=U.color,H=U.intensity,W=U.distance,$=U.shadow&&U.shadow.map?U.shadow.map.texture:null;if(U.isAmbientLight)d+=V.r*H,u+=V.g*H,f+=V.b*H;else if(U.isLightProbe){for(let G=0;G<9;G++)n.probe[G].addScaledVector(U.sh.coefficients[G],H);P++}else if(U.isDirectionalLight){let G=t.get(U);if(G.color.copy(U.color).multiplyScalar(U.intensity),U.castShadow){let rt=U.shadow,q=e.get(U);q.shadowIntensity=rt.intensity,q.shadowBias=rt.bias,q.shadowNormalBias=rt.normalBias,q.shadowRadius=rt.radius,q.shadowMapSize=rt.mapSize,n.directionalShadow[p]=q,n.directionalShadowMap[p]=$,n.directionalShadowMatrix[p]=U.shadow.matrix,E++}n.directional[p]=G,p++}else if(U.isSpotLight){let G=t.get(U);G.position.setFromMatrixPosition(U.matrixWorld),G.color.copy(V).multiplyScalar(H),G.distance=W,G.coneCos=Math.cos(U.angle),G.penumbraCos=Math.cos(U.angle*(1-U.penumbra)),G.decay=U.decay,n.spot[x]=G;let rt=U.shadow;if(U.map&&(n.spotLightMap[D]=U.map,D++,rt.updateMatrices(U),U.castShadow&&I++),n.spotLightMatrix[x]=rt.matrix,U.castShadow){let q=e.get(U);q.shadowIntensity=rt.intensity,q.shadowBias=rt.bias,q.shadowNormalBias=rt.normalBias,q.shadowRadius=rt.radius,q.shadowMapSize=rt.mapSize,n.spotShadow[x]=q,n.spotShadowMap[x]=$,v++}x++}else if(U.isRectAreaLight){let G=t.get(U);G.color.copy(V).multiplyScalar(H),G.halfWidth.set(U.width*.5,0,0),G.halfHeight.set(0,U.height*.5,0),n.rectArea[m]=G,m++}else if(U.isPointLight){let G=t.get(U);if(G.color.copy(U.color).multiplyScalar(U.intensity),G.distance=U.distance,G.decay=U.decay,U.castShadow){let rt=U.shadow,q=e.get(U);q.shadowIntensity=rt.intensity,q.shadowBias=rt.bias,q.shadowNormalBias=rt.normalBias,q.shadowRadius=rt.radius,q.shadowMapSize=rt.mapSize,q.shadowCameraNear=rt.camera.near,q.shadowCameraFar=rt.camera.far,n.pointShadow[g]=q,n.pointShadowMap[g]=$,n.pointShadowMatrix[g]=U.shadow.matrix,y++}n.point[g]=G,g++}else if(U.isHemisphereLight){let G=t.get(U);G.skyColor.copy(U.color).multiplyScalar(H),G.groundColor.copy(U.groundColor).multiplyScalar(H),n.hemi[l]=G,l++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=yt.LTC_FLOAT_1,n.rectAreaLTC2=yt.LTC_FLOAT_2):(n.rectAreaLTC1=yt.LTC_HALF_1,n.rectAreaLTC2=yt.LTC_HALF_2)),n.ambient[0]=d,n.ambient[1]=u,n.ambient[2]=f;let N=n.hash;(N.directionalLength!==p||N.pointLength!==g||N.spotLength!==x||N.rectAreaLength!==m||N.hemiLength!==l||N.numDirectionalShadows!==E||N.numPointShadows!==y||N.numSpotShadows!==v||N.numSpotMaps!==D||N.numLightProbes!==P)&&(n.directional.length=p,n.spot.length=x,n.rectArea.length=m,n.point.length=g,n.hemi.length=l,n.directionalShadow.length=E,n.directionalShadowMap.length=E,n.pointShadow.length=y,n.pointShadowMap.length=y,n.spotShadow.length=v,n.spotShadowMap.length=v,n.directionalShadowMatrix.length=E,n.pointShadowMatrix.length=y,n.spotLightMatrix.length=v+D-I,n.spotLightMap.length=D,n.numSpotLightShadowsWithMaps=I,n.numLightProbes=P,N.directionalLength=p,N.pointLength=g,N.spotLength=x,N.rectAreaLength=m,N.hemiLength=l,N.numDirectionalShadows=E,N.numPointShadows=y,N.numSpotShadows=v,N.numSpotMaps=D,N.numLightProbes=P,n.version=fm++)}function c(h,d){let u=0,f=0,p=0,g=0,x=0,m=d.matrixWorldInverse;for(let l=0,E=h.length;l<E;l++){let y=h[l];if(y.isDirectionalLight){let v=n.directional[u];v.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(m),u++}else if(y.isSpotLight){let v=n.spot[p];v.position.setFromMatrixPosition(y.matrixWorld),v.position.applyMatrix4(m),v.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(m),p++}else if(y.isRectAreaLight){let v=n.rectArea[g];v.position.setFromMatrixPosition(y.matrixWorld),v.position.applyMatrix4(m),o.identity(),r.copy(y.matrixWorld),r.premultiply(m),o.extractRotation(r),v.halfWidth.set(y.width*.5,0,0),v.halfHeight.set(0,y.height*.5,0),v.halfWidth.applyMatrix4(o),v.halfHeight.applyMatrix4(o),g++}else if(y.isPointLight){let v=n.point[f];v.position.setFromMatrixPosition(y.matrixWorld),v.position.applyMatrix4(m),f++}else if(y.isHemisphereLight){let v=n.hemi[x];v.direction.setFromMatrixPosition(y.matrixWorld),v.direction.transformDirection(m),x++}}}return{setup:a,setupView:c,state:n}}function Xc(i){let t=new mm(i),e=[],n=[];function s(d){h.camera=d,e.length=0,n.length=0}function r(d){e.push(d)}function o(d){n.push(d)}function a(){t.setup(e)}function c(d){t.setupView(e,d)}let h={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:h,setupLights:a,setupLightsView:c,pushLight:r,pushShadow:o}}function gm(i){let t=new WeakMap;function e(s,r=0){let o=t.get(s),a;return o===void 0?(a=new Xc(i),t.set(s,[a])):r>=o.length?(a=new Xc(i),o.push(a)):a=o[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}var ea=class extends ai{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=ah,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},na=class extends ai{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}},xm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,_m=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function ym(i,t,e){let n=new _s,s=new kt,r=new kt,o=new pe,a=new ea({depthPacking:ch}),c=new na,h={},d=e.maxTextureSize,u={[zn]:Ue,[Ue]:zn,[sn]:sn},f=new pn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new kt},radius:{value:4}},vertexShader:xm,fragmentShader:_m}),p=f.clone();p.defines.HORIZONTAL_PASS=1;let g=new He;g.setAttribute("position",new Ze(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new Yt(g,f),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Kc;let l=this.type;this.render=function(I,P,N){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||I.length===0)return;let w=i.getRenderTarget(),b=i.getActiveCubeFace(),U=i.getActiveMipmapLevel(),V=i.state;V.setBlending(Fn),V.buffers.color.setClear(1,1,1,1),V.buffers.depth.setTest(!0),V.setScissorTest(!1);let H=l!==Mn&&this.type===Mn,W=l===Mn&&this.type!==Mn;for(let $=0,G=I.length;$<G;$++){let rt=I[$],q=rt.shadow;if(q===void 0){console.warn("THREE.WebGLShadowMap:",rt,"has no shadow.");continue}if(q.autoUpdate===!1&&q.needsUpdate===!1)continue;s.copy(q.mapSize);let ut=q.getFrameExtents();if(s.multiply(ut),r.copy(q.mapSize),(s.x>d||s.y>d)&&(s.x>d&&(r.x=Math.floor(d/ut.x),s.x=r.x*ut.x,q.mapSize.x=r.x),s.y>d&&(r.y=Math.floor(d/ut.y),s.y=r.y*ut.y,q.mapSize.y=r.y)),q.map===null||H===!0||W===!0){let Ct=this.type!==Mn?{minFilter:on,magFilter:on}:{};q.map!==null&&q.map.dispose(),q.map=new An(s.x,s.y,Ct),q.map.texture.name=rt.name+".shadowMap",q.camera.updateProjectionMatrix()}i.setRenderTarget(q.map),i.clear();let Mt=q.getViewportCount();for(let Ct=0;Ct<Mt;Ct++){let Gt=q.getViewport(Ct);o.set(r.x*Gt.x,r.y*Gt.y,r.x*Gt.z,r.y*Gt.w),V.viewport(o),q.updateMatrices(rt,Ct),n=q.getFrustum(),v(P,N,q.camera,rt,this.type)}q.isPointLightShadow!==!0&&this.type===Mn&&E(q,N),q.needsUpdate=!1}l=this.type,m.needsUpdate=!1,i.setRenderTarget(w,b,U)};function E(I,P){let N=t.update(x);f.defines.VSM_SAMPLES!==I.blurSamples&&(f.defines.VSM_SAMPLES=I.blurSamples,p.defines.VSM_SAMPLES=I.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),I.mapPass===null&&(I.mapPass=new An(s.x,s.y)),f.uniforms.shadow_pass.value=I.map.texture,f.uniforms.resolution.value=I.mapSize,f.uniforms.radius.value=I.radius,i.setRenderTarget(I.mapPass),i.clear(),i.renderBufferDirect(P,null,N,f,x,null),p.uniforms.shadow_pass.value=I.mapPass.texture,p.uniforms.resolution.value=I.mapSize,p.uniforms.radius.value=I.radius,i.setRenderTarget(I.map),i.clear(),i.renderBufferDirect(P,null,N,p,x,null)}function y(I,P,N,w){let b=null,U=N.isPointLight===!0?I.customDistanceMaterial:I.customDepthMaterial;if(U!==void 0)b=U;else if(b=N.isPointLight===!0?c:a,i.localClippingEnabled&&P.clipShadows===!0&&Array.isArray(P.clippingPlanes)&&P.clippingPlanes.length!==0||P.displacementMap&&P.displacementScale!==0||P.alphaMap&&P.alphaTest>0||P.map&&P.alphaTest>0){let V=b.uuid,H=P.uuid,W=h[V];W===void 0&&(W={},h[V]=W);let $=W[H];$===void 0&&($=b.clone(),W[H]=$,P.addEventListener("dispose",D)),b=$}if(b.visible=P.visible,b.wireframe=P.wireframe,w===Mn?b.side=P.shadowSide!==null?P.shadowSide:P.side:b.side=P.shadowSide!==null?P.shadowSide:u[P.side],b.alphaMap=P.alphaMap,b.alphaTest=P.alphaTest,b.map=P.map,b.clipShadows=P.clipShadows,b.clippingPlanes=P.clippingPlanes,b.clipIntersection=P.clipIntersection,b.displacementMap=P.displacementMap,b.displacementScale=P.displacementScale,b.displacementBias=P.displacementBias,b.wireframeLinewidth=P.wireframeLinewidth,b.linewidth=P.linewidth,N.isPointLight===!0&&b.isMeshDistanceMaterial===!0){let V=i.properties.get(b);V.light=N}return b}function v(I,P,N,w,b){if(I.visible===!1)return;if(I.layers.test(P.layers)&&(I.isMesh||I.isLine||I.isPoints)&&(I.castShadow||I.receiveShadow&&b===Mn)&&(!I.frustumCulled||n.intersectsObject(I))){I.modelViewMatrix.multiplyMatrices(N.matrixWorldInverse,I.matrixWorld);let H=t.update(I),W=I.material;if(Array.isArray(W)){let $=H.groups;for(let G=0,rt=$.length;G<rt;G++){let q=$[G],ut=W[q.materialIndex];if(ut&&ut.visible){let Mt=y(I,ut,w,b);I.onBeforeShadow(i,I,P,N,H,Mt,q),i.renderBufferDirect(N,null,H,Mt,I,q),I.onAfterShadow(i,I,P,N,H,Mt,q)}}}else if(W.visible){let $=y(I,W,w,b);I.onBeforeShadow(i,I,P,N,H,$,null),i.renderBufferDirect(N,null,H,$,I,null),I.onAfterShadow(i,I,P,N,H,$,null)}}let V=I.children;for(let H=0,W=V.length;H<W;H++)v(V[H],P,N,w,b)}function D(I){I.target.removeEventListener("dispose",D);for(let N in h){let w=h[N],b=I.target.uuid;b in w&&(w[b].dispose(),delete w[b])}}}var vm={[so]:ro,[oo]:lo,[ao]:ho,[Ui]:co,[ro]:so,[lo]:oo,[ho]:ao,[co]:Ui};function Mm(i,t){function e(){let F=!1,ft=new pe,X=null,Q=new pe(0,0,0,0);return{setMask:function(gt){X!==gt&&!F&&(i.colorMask(gt,gt,gt,gt),X=gt)},setLocked:function(gt){F=gt},setClear:function(gt,xt,zt,ue,ve){ve===!0&&(gt*=ue,xt*=ue,zt*=ue),ft.set(gt,xt,zt,ue),Q.equals(ft)===!1&&(i.clearColor(gt,xt,zt,ue),Q.copy(ft))},reset:function(){F=!1,X=null,Q.set(-1,0,0,0)}}}function n(){let F=!1,ft=!1,X=null,Q=null,gt=null;return{setReversed:function(xt){if(ft!==xt){let zt=t.get("EXT_clip_control");ft?zt.clipControlEXT(zt.LOWER_LEFT_EXT,zt.ZERO_TO_ONE_EXT):zt.clipControlEXT(zt.LOWER_LEFT_EXT,zt.NEGATIVE_ONE_TO_ONE_EXT);let ue=gt;gt=null,this.setClear(ue)}ft=xt},getReversed:function(){return ft},setTest:function(xt){xt?mt(i.DEPTH_TEST):St(i.DEPTH_TEST)},setMask:function(xt){X!==xt&&!F&&(i.depthMask(xt),X=xt)},setFunc:function(xt){if(ft&&(xt=vm[xt]),Q!==xt){switch(xt){case so:i.depthFunc(i.NEVER);break;case ro:i.depthFunc(i.ALWAYS);break;case oo:i.depthFunc(i.LESS);break;case Ui:i.depthFunc(i.LEQUAL);break;case ao:i.depthFunc(i.EQUAL);break;case co:i.depthFunc(i.GEQUAL);break;case lo:i.depthFunc(i.GREATER);break;case ho:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}Q=xt}},setLocked:function(xt){F=xt},setClear:function(xt){gt!==xt&&(ft&&(xt=1-xt),i.clearDepth(xt),gt=xt)},reset:function(){F=!1,X=null,Q=null,gt=null,ft=!1}}}function s(){let F=!1,ft=null,X=null,Q=null,gt=null,xt=null,zt=null,ue=null,ve=null;return{setTest:function(ne){F||(ne?mt(i.STENCIL_TEST):St(i.STENCIL_TEST))},setMask:function(ne){ft!==ne&&!F&&(i.stencilMask(ne),ft=ne)},setFunc:function(ne,Te,ze){(X!==ne||Q!==Te||gt!==ze)&&(i.stencilFunc(ne,Te,ze),X=ne,Q=Te,gt=ze)},setOp:function(ne,Te,ze){(xt!==ne||zt!==Te||ue!==ze)&&(i.stencilOp(ne,Te,ze),xt=ne,zt=Te,ue=ze)},setLocked:function(ne){F=ne},setClear:function(ne){ve!==ne&&(i.clearStencil(ne),ve=ne)},reset:function(){F=!1,ft=null,X=null,Q=null,gt=null,xt=null,zt=null,ue=null,ve=null}}}let r=new e,o=new n,a=new s,c=new WeakMap,h=new WeakMap,d={},u={},f=new WeakMap,p=[],g=null,x=!1,m=null,l=null,E=null,y=null,v=null,D=null,I=null,P=new ie(0,0,0),N=0,w=!1,b=null,U=null,V=null,H=null,W=null,$=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),G=!1,rt=0,q=i.getParameter(i.VERSION);q.indexOf("WebGL")!==-1?(rt=parseFloat(/^WebGL (\d)/.exec(q)[1]),G=rt>=1):q.indexOf("OpenGL ES")!==-1&&(rt=parseFloat(/^OpenGL ES (\d)/.exec(q)[1]),G=rt>=2);let ut=null,Mt={},Ct=i.getParameter(i.SCISSOR_BOX),Gt=i.getParameter(i.VIEWPORT),se=new pe().fromArray(Ct),J=new pe().fromArray(Gt);function at(F,ft,X,Q){let gt=new Uint8Array(4),xt=i.createTexture();i.bindTexture(F,xt),i.texParameteri(F,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(F,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let zt=0;zt<X;zt++)F===i.TEXTURE_3D||F===i.TEXTURE_2D_ARRAY?i.texImage3D(ft,0,i.RGBA,1,1,Q,0,i.RGBA,i.UNSIGNED_BYTE,gt):i.texImage2D(ft+zt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,gt);return xt}let Rt={};Rt[i.TEXTURE_2D]=at(i.TEXTURE_2D,i.TEXTURE_2D,1),Rt[i.TEXTURE_CUBE_MAP]=at(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Rt[i.TEXTURE_2D_ARRAY]=at(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Rt[i.TEXTURE_3D]=at(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),mt(i.DEPTH_TEST),o.setFunc(Ui),Kt(!1),$t(qa),mt(i.CULL_FACE),B(Fn);function mt(F){d[F]!==!0&&(i.enable(F),d[F]=!0)}function St(F){d[F]!==!1&&(i.disable(F),d[F]=!1)}function At(F,ft){return u[F]!==ft?(i.bindFramebuffer(F,ft),u[F]=ft,F===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=ft),F===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=ft),!0):!1}function Ft(F,ft){let X=p,Q=!1;if(F){X=f.get(ft),X===void 0&&(X=[],f.set(ft,X));let gt=F.textures;if(X.length!==gt.length||X[0]!==i.COLOR_ATTACHMENT0){for(let xt=0,zt=gt.length;xt<zt;xt++)X[xt]=i.COLOR_ATTACHMENT0+xt;X.length=gt.length,Q=!0}}else X[0]!==i.BACK&&(X[0]=i.BACK,Q=!0);Q&&i.drawBuffers(X)}function ae(F){return g!==F?(i.useProgram(F),g=F,!0):!1}let Dt={[ti]:i.FUNC_ADD,[Nl]:i.FUNC_SUBTRACT,[Ol]:i.FUNC_REVERSE_SUBTRACT};Dt[Fl]=i.MIN,Dt[Bl]=i.MAX;let te={[zl]:i.ZERO,[kl]:i.ONE,[Hl]:i.SRC_COLOR,[no]:i.SRC_ALPHA,[Yl]:i.SRC_ALPHA_SATURATE,[Xl]:i.DST_COLOR,[Gl]:i.DST_ALPHA,[Vl]:i.ONE_MINUS_SRC_COLOR,[io]:i.ONE_MINUS_SRC_ALPHA,[ql]:i.ONE_MINUS_DST_COLOR,[Wl]:i.ONE_MINUS_DST_ALPHA,[$l]:i.CONSTANT_COLOR,[Zl]:i.ONE_MINUS_CONSTANT_COLOR,[Jl]:i.CONSTANT_ALPHA,[Kl]:i.ONE_MINUS_CONSTANT_ALPHA};function B(F,ft,X,Q,gt,xt,zt,ue,ve,ne){if(F===Fn){x===!0&&(St(i.BLEND),x=!1);return}if(x===!1&&(mt(i.BLEND),x=!0),F!==Ul){if(F!==m||ne!==w){if((l!==ti||v!==ti)&&(i.blendEquation(i.FUNC_ADD),l=ti,v=ti),ne)switch(F){case Ii:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ya:i.blendFunc(i.ONE,i.ONE);break;case $a:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Za:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",F);break}else switch(F){case Ii:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ya:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case $a:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Za:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",F);break}E=null,y=null,D=null,I=null,P.set(0,0,0),N=0,m=F,w=ne}return}gt=gt||ft,xt=xt||X,zt=zt||Q,(ft!==l||gt!==v)&&(i.blendEquationSeparate(Dt[ft],Dt[gt]),l=ft,v=gt),(X!==E||Q!==y||xt!==D||zt!==I)&&(i.blendFuncSeparate(te[X],te[Q],te[xt],te[zt]),E=X,y=Q,D=xt,I=zt),(ue.equals(P)===!1||ve!==N)&&(i.blendColor(ue.r,ue.g,ue.b,ve),P.copy(ue),N=ve),m=F,w=!1}function we(F,ft){F.side===sn?St(i.CULL_FACE):mt(i.CULL_FACE);let X=F.side===Ue;ft&&(X=!X),Kt(X),F.blending===Ii&&F.transparent===!1?B(Fn):B(F.blending,F.blendEquation,F.blendSrc,F.blendDst,F.blendEquationAlpha,F.blendSrcAlpha,F.blendDstAlpha,F.blendColor,F.blendAlpha,F.premultipliedAlpha),o.setFunc(F.depthFunc),o.setTest(F.depthTest),o.setMask(F.depthWrite),r.setMask(F.colorWrite);let Q=F.stencilWrite;a.setTest(Q),Q&&(a.setMask(F.stencilWriteMask),a.setFunc(F.stencilFunc,F.stencilRef,F.stencilFuncMask),a.setOp(F.stencilFail,F.stencilZFail,F.stencilZPass)),ce(F.polygonOffset,F.polygonOffsetFactor,F.polygonOffsetUnits),F.alphaToCoverage===!0?mt(i.SAMPLE_ALPHA_TO_COVERAGE):St(i.SAMPLE_ALPHA_TO_COVERAGE)}function Kt(F){b!==F&&(F?i.frontFace(i.CW):i.frontFace(i.CCW),b=F)}function $t(F){F!==Pl?(mt(i.CULL_FACE),F!==U&&(F===qa?i.cullFace(i.BACK):F===Ll?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):St(i.CULL_FACE),U=F}function Ut(F){F!==V&&(G&&i.lineWidth(F),V=F)}function ce(F,ft,X){F?(mt(i.POLYGON_OFFSET_FILL),(H!==ft||W!==X)&&(i.polygonOffset(ft,X),H=ft,W=X)):St(i.POLYGON_OFFSET_FILL)}function It(F){F?mt(i.SCISSOR_TEST):St(i.SCISSOR_TEST)}function R(F){F===void 0&&(F=i.TEXTURE0+$-1),ut!==F&&(i.activeTexture(F),ut=F)}function M(F,ft,X){X===void 0&&(ut===null?X=i.TEXTURE0+$-1:X=ut);let Q=Mt[X];Q===void 0&&(Q={type:void 0,texture:void 0},Mt[X]=Q),(Q.type!==F||Q.texture!==ft)&&(ut!==X&&(i.activeTexture(X),ut=X),i.bindTexture(F,ft||Rt[F]),Q.type=F,Q.texture=ft)}function k(){let F=Mt[ut];F!==void 0&&F.type!==void 0&&(i.bindTexture(F.type,null),F.type=void 0,F.texture=void 0)}function j(){try{i.compressedTexImage2D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function nt(){try{i.compressedTexImage3D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function K(){try{i.texSubImage2D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function lt(){try{i.texSubImage3D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function dt(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function vt(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Zt(){try{i.texStorage2D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function ot(){try{i.texStorage3D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function ht(){try{i.texImage2D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Tt(){try{i.texImage3D.apply(i,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Bt(F){se.equals(F)===!1&&(i.scissor(F.x,F.y,F.z,F.w),se.copy(F))}function ct(F){J.equals(F)===!1&&(i.viewport(F.x,F.y,F.z,F.w),J.copy(F))}function Wt(F,ft){let X=h.get(ft);X===void 0&&(X=new WeakMap,h.set(ft,X));let Q=X.get(F);Q===void 0&&(Q=i.getUniformBlockIndex(ft,F.name),X.set(F,Q))}function Nt(F,ft){let Q=h.get(ft).get(F);c.get(ft)!==Q&&(i.uniformBlockBinding(ft,Q,F.__bindingPointIndex),c.set(ft,Q))}function Et(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),d={},ut=null,Mt={},u={},f=new WeakMap,p=[],g=null,x=!1,m=null,l=null,E=null,y=null,v=null,D=null,I=null,P=new ie(0,0,0),N=0,w=!1,b=null,U=null,V=null,H=null,W=null,se.set(0,0,i.canvas.width,i.canvas.height),J.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:mt,disable:St,bindFramebuffer:At,drawBuffers:Ft,useProgram:ae,setBlending:B,setMaterial:we,setFlipSided:Kt,setCullFace:$t,setLineWidth:Ut,setPolygonOffset:ce,setScissorTest:It,activeTexture:R,bindTexture:M,unbindTexture:k,compressedTexImage2D:j,compressedTexImage3D:nt,texImage2D:ht,texImage3D:Tt,updateUBOMapping:Wt,uniformBlockBinding:Nt,texStorage2D:Zt,texStorage3D:ot,texSubImage2D:K,texSubImage3D:lt,compressedTexSubImage2D:dt,compressedTexSubImage3D:vt,scissor:Bt,viewport:ct,reset:Et}}function qc(i,t,e,n){let s=bm(n);switch(e){case il:return i*t;case rl:return i*t;case ol:return i*t*2;case al:return i*t/s.components*s.byteLength;case Ia:return i*t/s.components*s.byteLength;case cl:return i*t*2/s.components*s.byteLength;case Pa:return i*t*2/s.components*s.byteLength;case sl:return i*t*3/s.components*s.byteLength;case rn:return i*t*4/s.components*s.byteLength;case La:return i*t*4/s.components*s.byteLength;case $s:case Zs:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Js:case Ks:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case xo:case yo:return Math.max(i,16)*Math.max(t,8)/4;case go:case _o:return Math.max(i,8)*Math.max(t,8)/2;case vo:case Mo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case bo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case So:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Eo:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case wo:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case To:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case Ao:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case Co:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case Ro:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case Io:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case Po:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case Lo:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case Do:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case Uo:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case No:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Oo:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case js:case Fo:case Bo:return Math.ceil(i/4)*Math.ceil(t/4)*16;case ll:case zo:return Math.ceil(i/4)*Math.ceil(t/4)*8;case ko:case Ho:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function bm(i){switch(i){case Tn:case tl:return{byteLength:1,components:1};case ms:case el:case Ms:return{byteLength:2,components:1};case Ca:case Ra:return{byteLength:2,components:4};case ri:case Aa:case Sn:return{byteLength:4,components:1};case nl:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function Sm(i,t,e,n,s,r,o){let a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator=="undefined"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new kt,d=new WeakMap,u,f=new WeakMap,p=!1;try{p=typeof OffscreenCanvas!="undefined"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(R,M){return p?new OffscreenCanvas(R,M):er("canvas")}function x(R,M,k){let j=1,nt=It(R);if((nt.width>k||nt.height>k)&&(j=k/Math.max(nt.width,nt.height)),j<1)if(typeof HTMLImageElement!="undefined"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&R instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&R instanceof ImageBitmap||typeof VideoFrame!="undefined"&&R instanceof VideoFrame){let K=Math.floor(j*nt.width),lt=Math.floor(j*nt.height);u===void 0&&(u=g(K,lt));let dt=M?g(K,lt):u;return dt.width=K,dt.height=lt,dt.getContext("2d").drawImage(R,0,0,K,lt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+nt.width+"x"+nt.height+") to ("+K+"x"+lt+")."),dt}else return"data"in R&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+nt.width+"x"+nt.height+")."),R;return R}function m(R){return R.generateMipmaps}function l(R){i.generateMipmap(R)}function E(R){return R.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:R.isWebGL3DRenderTarget?i.TEXTURE_3D:R.isWebGLArrayRenderTarget||R.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function y(R,M,k,j,nt=!1){if(R!==null){if(i[R]!==void 0)return i[R];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let K=M;if(M===i.RED&&(k===i.FLOAT&&(K=i.R32F),k===i.HALF_FLOAT&&(K=i.R16F),k===i.UNSIGNED_BYTE&&(K=i.R8)),M===i.RED_INTEGER&&(k===i.UNSIGNED_BYTE&&(K=i.R8UI),k===i.UNSIGNED_SHORT&&(K=i.R16UI),k===i.UNSIGNED_INT&&(K=i.R32UI),k===i.BYTE&&(K=i.R8I),k===i.SHORT&&(K=i.R16I),k===i.INT&&(K=i.R32I)),M===i.RG&&(k===i.FLOAT&&(K=i.RG32F),k===i.HALF_FLOAT&&(K=i.RG16F),k===i.UNSIGNED_BYTE&&(K=i.RG8)),M===i.RG_INTEGER&&(k===i.UNSIGNED_BYTE&&(K=i.RG8UI),k===i.UNSIGNED_SHORT&&(K=i.RG16UI),k===i.UNSIGNED_INT&&(K=i.RG32UI),k===i.BYTE&&(K=i.RG8I),k===i.SHORT&&(K=i.RG16I),k===i.INT&&(K=i.RG32I)),M===i.RGB_INTEGER&&(k===i.UNSIGNED_BYTE&&(K=i.RGB8UI),k===i.UNSIGNED_SHORT&&(K=i.RGB16UI),k===i.UNSIGNED_INT&&(K=i.RGB32UI),k===i.BYTE&&(K=i.RGB8I),k===i.SHORT&&(K=i.RGB16I),k===i.INT&&(K=i.RGB32I)),M===i.RGBA_INTEGER&&(k===i.UNSIGNED_BYTE&&(K=i.RGBA8UI),k===i.UNSIGNED_SHORT&&(K=i.RGBA16UI),k===i.UNSIGNED_INT&&(K=i.RGBA32UI),k===i.BYTE&&(K=i.RGBA8I),k===i.SHORT&&(K=i.RGBA16I),k===i.INT&&(K=i.RGBA32I)),M===i.RGB&&k===i.UNSIGNED_INT_5_9_9_9_REV&&(K=i.RGB9_E5),M===i.RGBA){let lt=nt?xr:oe.getTransfer(j);k===i.FLOAT&&(K=i.RGBA32F),k===i.HALF_FLOAT&&(K=i.RGBA16F),k===i.UNSIGNED_BYTE&&(K=lt===fe?i.SRGB8_ALPHA8:i.RGBA8),k===i.UNSIGNED_SHORT_4_4_4_4&&(K=i.RGBA4),k===i.UNSIGNED_SHORT_5_5_5_1&&(K=i.RGB5_A1)}return(K===i.R16F||K===i.R32F||K===i.RG16F||K===i.RG32F||K===i.RGBA16F||K===i.RGBA32F)&&t.get("EXT_color_buffer_float"),K}function v(R,M){let k;return R?M===null||M===ri||M===Fi?k=i.DEPTH24_STENCIL8:M===Sn?k=i.DEPTH32F_STENCIL8:M===ms&&(k=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):M===null||M===ri||M===Fi?k=i.DEPTH_COMPONENT24:M===Sn?k=i.DEPTH_COMPONENT32F:M===ms&&(k=i.DEPTH_COMPONENT16),k}function D(R,M){return m(R)===!0||R.isFramebufferTexture&&R.minFilter!==on&&R.minFilter!==dn?Math.log2(Math.max(M.width,M.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?M.mipmaps.length:1}function I(R){let M=R.target;M.removeEventListener("dispose",I),N(M),M.isVideoTexture&&d.delete(M)}function P(R){let M=R.target;M.removeEventListener("dispose",P),b(M)}function N(R){let M=n.get(R);if(M.__webglInit===void 0)return;let k=R.source,j=f.get(k);if(j){let nt=j[M.__cacheKey];nt.usedTimes--,nt.usedTimes===0&&w(R),Object.keys(j).length===0&&f.delete(k)}n.remove(R)}function w(R){let M=n.get(R);i.deleteTexture(M.__webglTexture);let k=R.source,j=f.get(k);delete j[M.__cacheKey],o.memory.textures--}function b(R){let M=n.get(R);if(R.depthTexture&&(R.depthTexture.dispose(),n.remove(R.depthTexture)),R.isWebGLCubeRenderTarget)for(let j=0;j<6;j++){if(Array.isArray(M.__webglFramebuffer[j]))for(let nt=0;nt<M.__webglFramebuffer[j].length;nt++)i.deleteFramebuffer(M.__webglFramebuffer[j][nt]);else i.deleteFramebuffer(M.__webglFramebuffer[j]);M.__webglDepthbuffer&&i.deleteRenderbuffer(M.__webglDepthbuffer[j])}else{if(Array.isArray(M.__webglFramebuffer))for(let j=0;j<M.__webglFramebuffer.length;j++)i.deleteFramebuffer(M.__webglFramebuffer[j]);else i.deleteFramebuffer(M.__webglFramebuffer);if(M.__webglDepthbuffer&&i.deleteRenderbuffer(M.__webglDepthbuffer),M.__webglMultisampledFramebuffer&&i.deleteFramebuffer(M.__webglMultisampledFramebuffer),M.__webglColorRenderbuffer)for(let j=0;j<M.__webglColorRenderbuffer.length;j++)M.__webglColorRenderbuffer[j]&&i.deleteRenderbuffer(M.__webglColorRenderbuffer[j]);M.__webglDepthRenderbuffer&&i.deleteRenderbuffer(M.__webglDepthRenderbuffer)}let k=R.textures;for(let j=0,nt=k.length;j<nt;j++){let K=n.get(k[j]);K.__webglTexture&&(i.deleteTexture(K.__webglTexture),o.memory.textures--),n.remove(k[j])}n.remove(R)}let U=0;function V(){U=0}function H(){let R=U;return R>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+R+" texture units while this GPU supports only "+s.maxTextures),U+=1,R}function W(R){let M=[];return M.push(R.wrapS),M.push(R.wrapT),M.push(R.wrapR||0),M.push(R.magFilter),M.push(R.minFilter),M.push(R.anisotropy),M.push(R.internalFormat),M.push(R.format),M.push(R.type),M.push(R.generateMipmaps),M.push(R.premultiplyAlpha),M.push(R.flipY),M.push(R.unpackAlignment),M.push(R.colorSpace),M.join()}function $(R,M){let k=n.get(R);if(R.isVideoTexture&&Ut(R),R.isRenderTargetTexture===!1&&R.version>0&&k.__version!==R.version){let j=R.image;if(j===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(j.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{J(k,R,M);return}}e.bindTexture(i.TEXTURE_2D,k.__webglTexture,i.TEXTURE0+M)}function G(R,M){let k=n.get(R);if(R.version>0&&k.__version!==R.version){J(k,R,M);return}e.bindTexture(i.TEXTURE_2D_ARRAY,k.__webglTexture,i.TEXTURE0+M)}function rt(R,M){let k=n.get(R);if(R.version>0&&k.__version!==R.version){J(k,R,M);return}e.bindTexture(i.TEXTURE_3D,k.__webglTexture,i.TEXTURE0+M)}function q(R,M){let k=n.get(R);if(R.version>0&&k.__version!==R.version){at(k,R,M);return}e.bindTexture(i.TEXTURE_CUBE_MAP,k.__webglTexture,i.TEXTURE0+M)}let ut={[po]:i.REPEAT,[ii]:i.CLAMP_TO_EDGE,[mo]:i.MIRRORED_REPEAT},Mt={[on]:i.NEAREST,[oh]:i.NEAREST_MIPMAP_NEAREST,[ws]:i.NEAREST_MIPMAP_LINEAR,[dn]:i.LINEAR,[Sr]:i.LINEAR_MIPMAP_NEAREST,[si]:i.LINEAR_MIPMAP_LINEAR},Ct={[hh]:i.NEVER,[gh]:i.ALWAYS,[uh]:i.LESS,[ul]:i.LEQUAL,[dh]:i.EQUAL,[mh]:i.GEQUAL,[fh]:i.GREATER,[ph]:i.NOTEQUAL};function Gt(R,M){if(M.type===Sn&&t.has("OES_texture_float_linear")===!1&&(M.magFilter===dn||M.magFilter===Sr||M.magFilter===ws||M.magFilter===si||M.minFilter===dn||M.minFilter===Sr||M.minFilter===ws||M.minFilter===si)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(R,i.TEXTURE_WRAP_S,ut[M.wrapS]),i.texParameteri(R,i.TEXTURE_WRAP_T,ut[M.wrapT]),(R===i.TEXTURE_3D||R===i.TEXTURE_2D_ARRAY)&&i.texParameteri(R,i.TEXTURE_WRAP_R,ut[M.wrapR]),i.texParameteri(R,i.TEXTURE_MAG_FILTER,Mt[M.magFilter]),i.texParameteri(R,i.TEXTURE_MIN_FILTER,Mt[M.minFilter]),M.compareFunction&&(i.texParameteri(R,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(R,i.TEXTURE_COMPARE_FUNC,Ct[M.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(M.magFilter===on||M.minFilter!==ws&&M.minFilter!==si||M.type===Sn&&t.has("OES_texture_float_linear")===!1)return;if(M.anisotropy>1||n.get(M).__currentAnisotropy){let k=t.get("EXT_texture_filter_anisotropic");i.texParameterf(R,k.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,s.getMaxAnisotropy())),n.get(M).__currentAnisotropy=M.anisotropy}}}function se(R,M){let k=!1;R.__webglInit===void 0&&(R.__webglInit=!0,M.addEventListener("dispose",I));let j=M.source,nt=f.get(j);nt===void 0&&(nt={},f.set(j,nt));let K=W(M);if(K!==R.__cacheKey){nt[K]===void 0&&(nt[K]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,k=!0),nt[K].usedTimes++;let lt=nt[R.__cacheKey];lt!==void 0&&(nt[R.__cacheKey].usedTimes--,lt.usedTimes===0&&w(M)),R.__cacheKey=K,R.__webglTexture=nt[K].texture}return k}function J(R,M,k){let j=i.TEXTURE_2D;(M.isDataArrayTexture||M.isCompressedArrayTexture)&&(j=i.TEXTURE_2D_ARRAY),M.isData3DTexture&&(j=i.TEXTURE_3D);let nt=se(R,M),K=M.source;e.bindTexture(j,R.__webglTexture,i.TEXTURE0+k);let lt=n.get(K);if(K.version!==lt.__version||nt===!0){e.activeTexture(i.TEXTURE0+k);let dt=oe.getPrimaries(oe.workingColorSpace),vt=M.colorSpace===On?null:oe.getPrimaries(M.colorSpace),Zt=M.colorSpace===On||dt===vt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,M.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,M.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Zt);let ot=x(M.image,!1,s.maxTextureSize);ot=ce(M,ot);let ht=r.convert(M.format,M.colorSpace),Tt=r.convert(M.type),Bt=y(M.internalFormat,ht,Tt,M.colorSpace,M.isVideoTexture);Gt(j,M);let ct,Wt=M.mipmaps,Nt=M.isVideoTexture!==!0,Et=lt.__version===void 0||nt===!0,F=K.dataReady,ft=D(M,ot);if(M.isDepthTexture)Bt=v(M.format===Bi,M.type),Et&&(Nt?e.texStorage2D(i.TEXTURE_2D,1,Bt,ot.width,ot.height):e.texImage2D(i.TEXTURE_2D,0,Bt,ot.width,ot.height,0,ht,Tt,null));else if(M.isDataTexture)if(Wt.length>0){Nt&&Et&&e.texStorage2D(i.TEXTURE_2D,ft,Bt,Wt[0].width,Wt[0].height);for(let X=0,Q=Wt.length;X<Q;X++)ct=Wt[X],Nt?F&&e.texSubImage2D(i.TEXTURE_2D,X,0,0,ct.width,ct.height,ht,Tt,ct.data):e.texImage2D(i.TEXTURE_2D,X,Bt,ct.width,ct.height,0,ht,Tt,ct.data);M.generateMipmaps=!1}else Nt?(Et&&e.texStorage2D(i.TEXTURE_2D,ft,Bt,ot.width,ot.height),F&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,ot.width,ot.height,ht,Tt,ot.data)):e.texImage2D(i.TEXTURE_2D,0,Bt,ot.width,ot.height,0,ht,Tt,ot.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){Nt&&Et&&e.texStorage3D(i.TEXTURE_2D_ARRAY,ft,Bt,Wt[0].width,Wt[0].height,ot.depth);for(let X=0,Q=Wt.length;X<Q;X++)if(ct=Wt[X],M.format!==rn)if(ht!==null)if(Nt){if(F)if(M.layerUpdates.size>0){let gt=qc(ct.width,ct.height,M.format,M.type);for(let xt of M.layerUpdates){let zt=ct.data.subarray(xt*gt/ct.data.BYTES_PER_ELEMENT,(xt+1)*gt/ct.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,X,0,0,xt,ct.width,ct.height,1,ht,zt)}M.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,X,0,0,0,ct.width,ct.height,ot.depth,ht,ct.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,X,Bt,ct.width,ct.height,ot.depth,0,ct.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Nt?F&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,X,0,0,0,ct.width,ct.height,ot.depth,ht,Tt,ct.data):e.texImage3D(i.TEXTURE_2D_ARRAY,X,Bt,ct.width,ct.height,ot.depth,0,ht,Tt,ct.data)}else{Nt&&Et&&e.texStorage2D(i.TEXTURE_2D,ft,Bt,Wt[0].width,Wt[0].height);for(let X=0,Q=Wt.length;X<Q;X++)ct=Wt[X],M.format!==rn?ht!==null?Nt?F&&e.compressedTexSubImage2D(i.TEXTURE_2D,X,0,0,ct.width,ct.height,ht,ct.data):e.compressedTexImage2D(i.TEXTURE_2D,X,Bt,ct.width,ct.height,0,ct.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Nt?F&&e.texSubImage2D(i.TEXTURE_2D,X,0,0,ct.width,ct.height,ht,Tt,ct.data):e.texImage2D(i.TEXTURE_2D,X,Bt,ct.width,ct.height,0,ht,Tt,ct.data)}else if(M.isDataArrayTexture)if(Nt){if(Et&&e.texStorage3D(i.TEXTURE_2D_ARRAY,ft,Bt,ot.width,ot.height,ot.depth),F)if(M.layerUpdates.size>0){let X=qc(ot.width,ot.height,M.format,M.type);for(let Q of M.layerUpdates){let gt=ot.data.subarray(Q*X/ot.data.BYTES_PER_ELEMENT,(Q+1)*X/ot.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Q,ot.width,ot.height,1,ht,Tt,gt)}M.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,ot.width,ot.height,ot.depth,ht,Tt,ot.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,Bt,ot.width,ot.height,ot.depth,0,ht,Tt,ot.data);else if(M.isData3DTexture)Nt?(Et&&e.texStorage3D(i.TEXTURE_3D,ft,Bt,ot.width,ot.height,ot.depth),F&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,ot.width,ot.height,ot.depth,ht,Tt,ot.data)):e.texImage3D(i.TEXTURE_3D,0,Bt,ot.width,ot.height,ot.depth,0,ht,Tt,ot.data);else if(M.isFramebufferTexture){if(Et)if(Nt)e.texStorage2D(i.TEXTURE_2D,ft,Bt,ot.width,ot.height);else{let X=ot.width,Q=ot.height;for(let gt=0;gt<ft;gt++)e.texImage2D(i.TEXTURE_2D,gt,Bt,X,Q,0,ht,Tt,null),X>>=1,Q>>=1}}else if(Wt.length>0){if(Nt&&Et){let X=It(Wt[0]);e.texStorage2D(i.TEXTURE_2D,ft,Bt,X.width,X.height)}for(let X=0,Q=Wt.length;X<Q;X++)ct=Wt[X],Nt?F&&e.texSubImage2D(i.TEXTURE_2D,X,0,0,ht,Tt,ct):e.texImage2D(i.TEXTURE_2D,X,Bt,ht,Tt,ct);M.generateMipmaps=!1}else if(Nt){if(Et){let X=It(ot);e.texStorage2D(i.TEXTURE_2D,ft,Bt,X.width,X.height)}F&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,ht,Tt,ot)}else e.texImage2D(i.TEXTURE_2D,0,Bt,ht,Tt,ot);m(M)&&l(j),lt.__version=K.version,M.onUpdate&&M.onUpdate(M)}R.__version=M.version}function at(R,M,k){if(M.image.length!==6)return;let j=se(R,M),nt=M.source;e.bindTexture(i.TEXTURE_CUBE_MAP,R.__webglTexture,i.TEXTURE0+k);let K=n.get(nt);if(nt.version!==K.__version||j===!0){e.activeTexture(i.TEXTURE0+k);let lt=oe.getPrimaries(oe.workingColorSpace),dt=M.colorSpace===On?null:oe.getPrimaries(M.colorSpace),vt=M.colorSpace===On||lt===dt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,M.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,M.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,vt);let Zt=M.isCompressedTexture||M.image[0].isCompressedTexture,ot=M.image[0]&&M.image[0].isDataTexture,ht=[];for(let Q=0;Q<6;Q++)!Zt&&!ot?ht[Q]=x(M.image[Q],!0,s.maxCubemapSize):ht[Q]=ot?M.image[Q].image:M.image[Q],ht[Q]=ce(M,ht[Q]);let Tt=ht[0],Bt=r.convert(M.format,M.colorSpace),ct=r.convert(M.type),Wt=y(M.internalFormat,Bt,ct,M.colorSpace),Nt=M.isVideoTexture!==!0,Et=K.__version===void 0||j===!0,F=nt.dataReady,ft=D(M,Tt);Gt(i.TEXTURE_CUBE_MAP,M);let X;if(Zt){Nt&&Et&&e.texStorage2D(i.TEXTURE_CUBE_MAP,ft,Wt,Tt.width,Tt.height);for(let Q=0;Q<6;Q++){X=ht[Q].mipmaps;for(let gt=0;gt<X.length;gt++){let xt=X[gt];M.format!==rn?Bt!==null?Nt?F&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,gt,0,0,xt.width,xt.height,Bt,xt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,gt,Wt,xt.width,xt.height,0,xt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Nt?F&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,gt,0,0,xt.width,xt.height,Bt,ct,xt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,gt,Wt,xt.width,xt.height,0,Bt,ct,xt.data)}}}else{if(X=M.mipmaps,Nt&&Et){X.length>0&&ft++;let Q=It(ht[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,ft,Wt,Q.width,Q.height)}for(let Q=0;Q<6;Q++)if(ot){Nt?F&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,0,0,ht[Q].width,ht[Q].height,Bt,ct,ht[Q].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,Wt,ht[Q].width,ht[Q].height,0,Bt,ct,ht[Q].data);for(let gt=0;gt<X.length;gt++){let zt=X[gt].image[Q].image;Nt?F&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,gt+1,0,0,zt.width,zt.height,Bt,ct,zt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,gt+1,Wt,zt.width,zt.height,0,Bt,ct,zt.data)}}else{Nt?F&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,0,0,Bt,ct,ht[Q]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,Wt,Bt,ct,ht[Q]);for(let gt=0;gt<X.length;gt++){let xt=X[gt];Nt?F&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,gt+1,0,0,Bt,ct,xt.image[Q]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,gt+1,Wt,Bt,ct,xt.image[Q])}}}m(M)&&l(i.TEXTURE_CUBE_MAP),K.__version=nt.version,M.onUpdate&&M.onUpdate(M)}R.__version=M.version}function Rt(R,M,k,j,nt,K){let lt=r.convert(k.format,k.colorSpace),dt=r.convert(k.type),vt=y(k.internalFormat,lt,dt,k.colorSpace),Zt=n.get(M),ot=n.get(k);if(ot.__renderTarget=M,!Zt.__hasExternalTextures){let ht=Math.max(1,M.width>>K),Tt=Math.max(1,M.height>>K);nt===i.TEXTURE_3D||nt===i.TEXTURE_2D_ARRAY?e.texImage3D(nt,K,vt,ht,Tt,M.depth,0,lt,dt,null):e.texImage2D(nt,K,vt,ht,Tt,0,lt,dt,null)}e.bindFramebuffer(i.FRAMEBUFFER,R),$t(M)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,j,nt,ot.__webglTexture,0,Kt(M)):(nt===i.TEXTURE_2D||nt>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&nt<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,j,nt,ot.__webglTexture,K),e.bindFramebuffer(i.FRAMEBUFFER,null)}function mt(R,M,k){if(i.bindRenderbuffer(i.RENDERBUFFER,R),M.depthBuffer){let j=M.depthTexture,nt=j&&j.isDepthTexture?j.type:null,K=v(M.stencilBuffer,nt),lt=M.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,dt=Kt(M);$t(M)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,dt,K,M.width,M.height):k?i.renderbufferStorageMultisample(i.RENDERBUFFER,dt,K,M.width,M.height):i.renderbufferStorage(i.RENDERBUFFER,K,M.width,M.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,lt,i.RENDERBUFFER,R)}else{let j=M.textures;for(let nt=0;nt<j.length;nt++){let K=j[nt],lt=r.convert(K.format,K.colorSpace),dt=r.convert(K.type),vt=y(K.internalFormat,lt,dt,K.colorSpace),Zt=Kt(M);k&&$t(M)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Zt,vt,M.width,M.height):$t(M)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Zt,vt,M.width,M.height):i.renderbufferStorage(i.RENDERBUFFER,vt,M.width,M.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function St(R,M){if(M&&M.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,R),!(M.depthTexture&&M.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let j=n.get(M.depthTexture);j.__renderTarget=M,(!j.__webglTexture||M.depthTexture.image.width!==M.width||M.depthTexture.image.height!==M.height)&&(M.depthTexture.image.width=M.width,M.depthTexture.image.height=M.height,M.depthTexture.needsUpdate=!0),$(M.depthTexture,0);let nt=j.__webglTexture,K=Kt(M);if(M.depthTexture.format===Pi)$t(M)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,nt,0,K):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,nt,0);else if(M.depthTexture.format===Bi)$t(M)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,nt,0,K):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,nt,0);else throw new Error("Unknown depthTexture format")}function At(R){let M=n.get(R),k=R.isWebGLCubeRenderTarget===!0;if(M.__boundDepthTexture!==R.depthTexture){let j=R.depthTexture;if(M.__depthDisposeCallback&&M.__depthDisposeCallback(),j){let nt=()=>{delete M.__boundDepthTexture,delete M.__depthDisposeCallback,j.removeEventListener("dispose",nt)};j.addEventListener("dispose",nt),M.__depthDisposeCallback=nt}M.__boundDepthTexture=j}if(R.depthTexture&&!M.__autoAllocateDepthBuffer){if(k)throw new Error("target.depthTexture not supported in Cube render targets");St(M.__webglFramebuffer,R)}else if(k){M.__webglDepthbuffer=[];for(let j=0;j<6;j++)if(e.bindFramebuffer(i.FRAMEBUFFER,M.__webglFramebuffer[j]),M.__webglDepthbuffer[j]===void 0)M.__webglDepthbuffer[j]=i.createRenderbuffer(),mt(M.__webglDepthbuffer[j],R,!1);else{let nt=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,K=M.__webglDepthbuffer[j];i.bindRenderbuffer(i.RENDERBUFFER,K),i.framebufferRenderbuffer(i.FRAMEBUFFER,nt,i.RENDERBUFFER,K)}}else if(e.bindFramebuffer(i.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer===void 0)M.__webglDepthbuffer=i.createRenderbuffer(),mt(M.__webglDepthbuffer,R,!1);else{let j=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,nt=M.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,nt),i.framebufferRenderbuffer(i.FRAMEBUFFER,j,i.RENDERBUFFER,nt)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function Ft(R,M,k){let j=n.get(R);M!==void 0&&Rt(j.__webglFramebuffer,R,R.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),k!==void 0&&At(R)}function ae(R){let M=R.texture,k=n.get(R),j=n.get(M);R.addEventListener("dispose",P);let nt=R.textures,K=R.isWebGLCubeRenderTarget===!0,lt=nt.length>1;if(lt||(j.__webglTexture===void 0&&(j.__webglTexture=i.createTexture()),j.__version=M.version,o.memory.textures++),K){k.__webglFramebuffer=[];for(let dt=0;dt<6;dt++)if(M.mipmaps&&M.mipmaps.length>0){k.__webglFramebuffer[dt]=[];for(let vt=0;vt<M.mipmaps.length;vt++)k.__webglFramebuffer[dt][vt]=i.createFramebuffer()}else k.__webglFramebuffer[dt]=i.createFramebuffer()}else{if(M.mipmaps&&M.mipmaps.length>0){k.__webglFramebuffer=[];for(let dt=0;dt<M.mipmaps.length;dt++)k.__webglFramebuffer[dt]=i.createFramebuffer()}else k.__webglFramebuffer=i.createFramebuffer();if(lt)for(let dt=0,vt=nt.length;dt<vt;dt++){let Zt=n.get(nt[dt]);Zt.__webglTexture===void 0&&(Zt.__webglTexture=i.createTexture(),o.memory.textures++)}if(R.samples>0&&$t(R)===!1){k.__webglMultisampledFramebuffer=i.createFramebuffer(),k.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,k.__webglMultisampledFramebuffer);for(let dt=0;dt<nt.length;dt++){let vt=nt[dt];k.__webglColorRenderbuffer[dt]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,k.__webglColorRenderbuffer[dt]);let Zt=r.convert(vt.format,vt.colorSpace),ot=r.convert(vt.type),ht=y(vt.internalFormat,Zt,ot,vt.colorSpace,R.isXRRenderTarget===!0),Tt=Kt(R);i.renderbufferStorageMultisample(i.RENDERBUFFER,Tt,ht,R.width,R.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+dt,i.RENDERBUFFER,k.__webglColorRenderbuffer[dt])}i.bindRenderbuffer(i.RENDERBUFFER,null),R.depthBuffer&&(k.__webglDepthRenderbuffer=i.createRenderbuffer(),mt(k.__webglDepthRenderbuffer,R,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(K){e.bindTexture(i.TEXTURE_CUBE_MAP,j.__webglTexture),Gt(i.TEXTURE_CUBE_MAP,M);for(let dt=0;dt<6;dt++)if(M.mipmaps&&M.mipmaps.length>0)for(let vt=0;vt<M.mipmaps.length;vt++)Rt(k.__webglFramebuffer[dt][vt],R,M,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,vt);else Rt(k.__webglFramebuffer[dt],R,M,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,0);m(M)&&l(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(lt){for(let dt=0,vt=nt.length;dt<vt;dt++){let Zt=nt[dt],ot=n.get(Zt);e.bindTexture(i.TEXTURE_2D,ot.__webglTexture),Gt(i.TEXTURE_2D,Zt),Rt(k.__webglFramebuffer,R,Zt,i.COLOR_ATTACHMENT0+dt,i.TEXTURE_2D,0),m(Zt)&&l(i.TEXTURE_2D)}e.unbindTexture()}else{let dt=i.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(dt=R.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(dt,j.__webglTexture),Gt(dt,M),M.mipmaps&&M.mipmaps.length>0)for(let vt=0;vt<M.mipmaps.length;vt++)Rt(k.__webglFramebuffer[vt],R,M,i.COLOR_ATTACHMENT0,dt,vt);else Rt(k.__webglFramebuffer,R,M,i.COLOR_ATTACHMENT0,dt,0);m(M)&&l(dt),e.unbindTexture()}R.depthBuffer&&At(R)}function Dt(R){let M=R.textures;for(let k=0,j=M.length;k<j;k++){let nt=M[k];if(m(nt)){let K=E(R),lt=n.get(nt).__webglTexture;e.bindTexture(K,lt),l(K),e.unbindTexture()}}}let te=[],B=[];function we(R){if(R.samples>0){if($t(R)===!1){let M=R.textures,k=R.width,j=R.height,nt=i.COLOR_BUFFER_BIT,K=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,lt=n.get(R),dt=M.length>1;if(dt)for(let vt=0;vt<M.length;vt++)e.bindFramebuffer(i.FRAMEBUFFER,lt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+vt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,lt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+vt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,lt.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,lt.__webglFramebuffer);for(let vt=0;vt<M.length;vt++){if(R.resolveDepthBuffer&&(R.depthBuffer&&(nt|=i.DEPTH_BUFFER_BIT),R.stencilBuffer&&R.resolveStencilBuffer&&(nt|=i.STENCIL_BUFFER_BIT)),dt){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,lt.__webglColorRenderbuffer[vt]);let Zt=n.get(M[vt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Zt,0)}i.blitFramebuffer(0,0,k,j,0,0,k,j,nt,i.NEAREST),c===!0&&(te.length=0,B.length=0,te.push(i.COLOR_ATTACHMENT0+vt),R.depthBuffer&&R.resolveDepthBuffer===!1&&(te.push(K),B.push(K),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,B)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,te))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),dt)for(let vt=0;vt<M.length;vt++){e.bindFramebuffer(i.FRAMEBUFFER,lt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+vt,i.RENDERBUFFER,lt.__webglColorRenderbuffer[vt]);let Zt=n.get(M[vt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,lt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+vt,i.TEXTURE_2D,Zt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,lt.__webglMultisampledFramebuffer)}else if(R.depthBuffer&&R.resolveDepthBuffer===!1&&c){let M=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[M])}}}function Kt(R){return Math.min(s.maxSamples,R.samples)}function $t(R){let M=n.get(R);return R.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function Ut(R){let M=o.render.frame;d.get(R)!==M&&(d.set(R,M),R.update())}function ce(R,M){let k=R.colorSpace,j=R.format,nt=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||k!==Yi&&k!==On&&(oe.getTransfer(k)===fe?(j!==rn||nt!==Tn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",k)),M}function It(R){return typeof HTMLImageElement!="undefined"&&R instanceof HTMLImageElement?(h.width=R.naturalWidth||R.width,h.height=R.naturalHeight||R.height):typeof VideoFrame!="undefined"&&R instanceof VideoFrame?(h.width=R.displayWidth,h.height=R.displayHeight):(h.width=R.width,h.height=R.height),h}this.allocateTextureUnit=H,this.resetTextureUnits=V,this.setTexture2D=$,this.setTexture2DArray=G,this.setTexture3D=rt,this.setTextureCube=q,this.rebindTextures=Ft,this.setupRenderTarget=ae,this.updateRenderTargetMipmap=Dt,this.updateMultisampleRenderTarget=we,this.setupDepthRenderbuffer=At,this.setupFrameBufferTexture=Rt,this.useMultisampledRTT=$t}function Em(i,t){function e(n,s=On){let r,o=oe.getTransfer(s);if(n===Tn)return i.UNSIGNED_BYTE;if(n===Ca)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Ra)return i.UNSIGNED_SHORT_5_5_5_1;if(n===nl)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===tl)return i.BYTE;if(n===el)return i.SHORT;if(n===ms)return i.UNSIGNED_SHORT;if(n===Aa)return i.INT;if(n===ri)return i.UNSIGNED_INT;if(n===Sn)return i.FLOAT;if(n===Ms)return i.HALF_FLOAT;if(n===il)return i.ALPHA;if(n===sl)return i.RGB;if(n===rn)return i.RGBA;if(n===rl)return i.LUMINANCE;if(n===ol)return i.LUMINANCE_ALPHA;if(n===Pi)return i.DEPTH_COMPONENT;if(n===Bi)return i.DEPTH_STENCIL;if(n===al)return i.RED;if(n===Ia)return i.RED_INTEGER;if(n===cl)return i.RG;if(n===Pa)return i.RG_INTEGER;if(n===La)return i.RGBA_INTEGER;if(n===$s||n===Zs||n===Js||n===Ks)if(o===fe)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===$s)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Zs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Js)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Ks)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===$s)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Zs)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Js)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Ks)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===go||n===xo||n===_o||n===yo)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===go)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===xo)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===_o)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===yo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===vo||n===Mo||n===bo)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===vo||n===Mo)return o===fe?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===bo)return o===fe?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===So||n===Eo||n===wo||n===To||n===Ao||n===Co||n===Ro||n===Io||n===Po||n===Lo||n===Do||n===Uo||n===No||n===Oo)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===So)return o===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Eo)return o===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===wo)return o===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===To)return o===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ao)return o===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Co)return o===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Ro)return o===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Io)return o===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Po)return o===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Lo)return o===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Do)return o===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Uo)return o===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===No)return o===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Oo)return o===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===js||n===Fo||n===Bo)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===js)return o===fe?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Fo)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Bo)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===ll||n===zo||n===ko||n===Ho)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===js)return r.COMPRESSED_RED_RGTC1_EXT;if(n===zo)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===ko)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Ho)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Fi?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var ia=class extends Re{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}},$e=class extends Be{constructor(){super(),this.isGroup=!0,this.type="Group"}},wm={type:"move"},ds=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new $e,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new $e,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new L,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new L),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new $e,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new L,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new L),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,o=null,a=this._targetRay,c=this._grip,h=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(h&&t.hand){o=!0;for(let x of t.hand.values()){let m=e.getJointPose(x,n),l=this._getHandJoint(h,x);m!==null&&(l.matrix.fromArray(m.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,l.jointRadius=m.radius),l.visible=m!==null}let d=h.joints["index-finger-tip"],u=h.joints["thumb-tip"],f=d.position.distanceTo(u.position),p=.02,g=.005;h.inputState.pinching&&f>p+g?(h.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!h.inputState.pinching&&f<=p-g&&(h.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(wm)))}return a!==null&&(a.visible=s!==null),c!==null&&(c.visible=r!==null),h!==null&&(h.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new $e;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},Tm=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Am=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,sa=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){let s=new Je,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new pn({vertexShader:Tm,fragmentShader:Am,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Yt(new lr(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},ra=class extends kn{constructor(t,e){super();let n=this,s=null,r=1,o=null,a="local-floor",c=1,h=null,d=null,u=null,f=null,p=null,g=null,x=new sa,m=e.getContextAttributes(),l=null,E=null,y=[],v=[],D=new kt,I=null,P=new Re;P.viewport=new pe;let N=new Re;N.viewport=new pe;let w=[P,N],b=new ia,U=null,V=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(J){let at=y[J];return at===void 0&&(at=new ds,y[J]=at),at.getTargetRaySpace()},this.getControllerGrip=function(J){let at=y[J];return at===void 0&&(at=new ds,y[J]=at),at.getGripSpace()},this.getHand=function(J){let at=y[J];return at===void 0&&(at=new ds,y[J]=at),at.getHandSpace()};function H(J){let at=v.indexOf(J.inputSource);if(at===-1)return;let Rt=y[at];Rt!==void 0&&(Rt.update(J.inputSource,J.frame,h||o),Rt.dispatchEvent({type:J.type,data:J.inputSource}))}function W(){s.removeEventListener("select",H),s.removeEventListener("selectstart",H),s.removeEventListener("selectend",H),s.removeEventListener("squeeze",H),s.removeEventListener("squeezestart",H),s.removeEventListener("squeezeend",H),s.removeEventListener("end",W),s.removeEventListener("inputsourceschange",$);for(let J=0;J<y.length;J++){let at=v[J];at!==null&&(v[J]=null,y[J].disconnect(at))}U=null,V=null,x.reset(),t.setRenderTarget(l),p=null,f=null,u=null,s=null,E=null,se.stop(),n.isPresenting=!1,t.setPixelRatio(I),t.setSize(D.width,D.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(J){r=J,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(J){a=J,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return h||o},this.setReferenceSpace=function(J){h=J},this.getBaseLayer=function(){return f!==null?f:p},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(J){if(s=J,s!==null){if(l=t.getRenderTarget(),s.addEventListener("select",H),s.addEventListener("selectstart",H),s.addEventListener("selectend",H),s.addEventListener("squeeze",H),s.addEventListener("squeezestart",H),s.addEventListener("squeezeend",H),s.addEventListener("end",W),s.addEventListener("inputsourceschange",$),m.xrCompatible!==!0&&await e.makeXRCompatible(),I=t.getPixelRatio(),t.getSize(D),s.renderState.layers===void 0){let at={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(s,e,at),s.updateRenderState({baseLayer:p}),t.setPixelRatio(1),t.setSize(p.framebufferWidth,p.framebufferHeight,!1),E=new An(p.framebufferWidth,p.framebufferHeight,{format:rn,type:Tn,colorSpace:t.outputColorSpace,stencilBuffer:m.stencil})}else{let at=null,Rt=null,mt=null;m.depth&&(mt=m.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,at=m.stencil?Bi:Pi,Rt=m.stencil?Fi:ri);let St={colorFormat:e.RGBA8,depthFormat:mt,scaleFactor:r};u=new XRWebGLBinding(s,e),f=u.createProjectionLayer(St),s.updateRenderState({layers:[f]}),t.setPixelRatio(1),t.setSize(f.textureWidth,f.textureHeight,!1),E=new An(f.textureWidth,f.textureHeight,{format:rn,type:Tn,depthTexture:new ur(f.textureWidth,f.textureHeight,Rt,void 0,void 0,void 0,void 0,void 0,void 0,at),stencilBuffer:m.stencil,colorSpace:t.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1})}E.isXRRenderTarget=!0,this.setFoveation(c),h=null,o=await s.requestReferenceSpace(a),se.setContext(s),se.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function $(J){for(let at=0;at<J.removed.length;at++){let Rt=J.removed[at],mt=v.indexOf(Rt);mt>=0&&(v[mt]=null,y[mt].disconnect(Rt))}for(let at=0;at<J.added.length;at++){let Rt=J.added[at],mt=v.indexOf(Rt);if(mt===-1){for(let At=0;At<y.length;At++)if(At>=v.length){v.push(Rt),mt=At;break}else if(v[At]===null){v[At]=Rt,mt=At;break}if(mt===-1)break}let St=y[mt];St&&St.connect(Rt)}}let G=new L,rt=new L;function q(J,at,Rt){G.setFromMatrixPosition(at.matrixWorld),rt.setFromMatrixPosition(Rt.matrixWorld);let mt=G.distanceTo(rt),St=at.projectionMatrix.elements,At=Rt.projectionMatrix.elements,Ft=St[14]/(St[10]-1),ae=St[14]/(St[10]+1),Dt=(St[9]+1)/St[5],te=(St[9]-1)/St[5],B=(St[8]-1)/St[0],we=(At[8]+1)/At[0],Kt=Ft*B,$t=Ft*we,Ut=mt/(-B+we),ce=Ut*-B;if(at.matrixWorld.decompose(J.position,J.quaternion,J.scale),J.translateX(ce),J.translateZ(Ut),J.matrixWorld.compose(J.position,J.quaternion,J.scale),J.matrixWorldInverse.copy(J.matrixWorld).invert(),St[10]===-1)J.projectionMatrix.copy(at.projectionMatrix),J.projectionMatrixInverse.copy(at.projectionMatrixInverse);else{let It=Ft+Ut,R=ae+Ut,M=Kt-ce,k=$t+(mt-ce),j=Dt*ae/R*It,nt=te*ae/R*It;J.projectionMatrix.makePerspective(M,k,j,nt,It,R),J.projectionMatrixInverse.copy(J.projectionMatrix).invert()}}function ut(J,at){at===null?J.matrixWorld.copy(J.matrix):J.matrixWorld.multiplyMatrices(at.matrixWorld,J.matrix),J.matrixWorldInverse.copy(J.matrixWorld).invert()}this.updateCamera=function(J){if(s===null)return;let at=J.near,Rt=J.far;x.texture!==null&&(x.depthNear>0&&(at=x.depthNear),x.depthFar>0&&(Rt=x.depthFar)),b.near=N.near=P.near=at,b.far=N.far=P.far=Rt,(U!==b.near||V!==b.far)&&(s.updateRenderState({depthNear:b.near,depthFar:b.far}),U=b.near,V=b.far),P.layers.mask=J.layers.mask|2,N.layers.mask=J.layers.mask|4,b.layers.mask=P.layers.mask|N.layers.mask;let mt=J.parent,St=b.cameras;ut(b,mt);for(let At=0;At<St.length;At++)ut(St[At],mt);St.length===2?q(b,P,N):b.projectionMatrix.copy(P.projectionMatrix),Mt(J,b,mt)};function Mt(J,at,Rt){Rt===null?J.matrix.copy(at.matrixWorld):(J.matrix.copy(Rt.matrixWorld),J.matrix.invert(),J.matrix.multiply(at.matrixWorld)),J.matrix.decompose(J.position,J.quaternion,J.scale),J.updateMatrixWorld(!0),J.projectionMatrix.copy(at.projectionMatrix),J.projectionMatrixInverse.copy(at.projectionMatrixInverse),J.isPerspectiveCamera&&(J.fov=gs*2*Math.atan(1/J.projectionMatrix.elements[5]),J.zoom=1)}this.getCamera=function(){return b},this.getFoveation=function(){if(!(f===null&&p===null))return c},this.setFoveation=function(J){c=J,f!==null&&(f.fixedFoveation=J),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=J)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(b)};let Ct=null;function Gt(J,at){if(d=at.getViewerPose(h||o),g=at,d!==null){let Rt=d.views;p!==null&&(t.setRenderTargetFramebuffer(E,p.framebuffer),t.setRenderTarget(E));let mt=!1;Rt.length!==b.cameras.length&&(b.cameras.length=0,mt=!0);for(let At=0;At<Rt.length;At++){let Ft=Rt[At],ae=null;if(p!==null)ae=p.getViewport(Ft);else{let te=u.getViewSubImage(f,Ft);ae=te.viewport,At===0&&(t.setRenderTargetTextures(E,te.colorTexture,f.ignoreDepthValues?void 0:te.depthStencilTexture),t.setRenderTarget(E))}let Dt=w[At];Dt===void 0&&(Dt=new Re,Dt.layers.enable(At),Dt.viewport=new pe,w[At]=Dt),Dt.matrix.fromArray(Ft.transform.matrix),Dt.matrix.decompose(Dt.position,Dt.quaternion,Dt.scale),Dt.projectionMatrix.fromArray(Ft.projectionMatrix),Dt.projectionMatrixInverse.copy(Dt.projectionMatrix).invert(),Dt.viewport.set(ae.x,ae.y,ae.width,ae.height),At===0&&(b.matrix.copy(Dt.matrix),b.matrix.decompose(b.position,b.quaternion,b.scale)),mt===!0&&b.cameras.push(Dt)}let St=s.enabledFeatures;if(St&&St.includes("depth-sensing")){let At=u.getDepthInformation(Rt[0]);At&&At.isValid&&At.texture&&x.init(t,At,s.renderState)}}for(let Rt=0;Rt<y.length;Rt++){let mt=v[Rt],St=y[Rt];mt!==null&&St!==void 0&&St.update(mt,at,h||o)}Ct&&Ct(J,at),at.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:at}),g=null}let se=new ml;se.setAnimationLoop(Gt),this.setAnimationLoop=function(J){Ct=J},this.dispose=function(){}}},jn=new fn,Cm=new _e;function Rm(i,t){function e(m,l){m.matrixAutoUpdate===!0&&m.updateMatrix(),l.value.copy(m.matrix)}function n(m,l){l.color.getRGB(m.fogColor.value,pl(i)),l.isFog?(m.fogNear.value=l.near,m.fogFar.value=l.far):l.isFogExp2&&(m.fogDensity.value=l.density)}function s(m,l,E,y,v){l.isMeshBasicMaterial||l.isMeshLambertMaterial?r(m,l):l.isMeshToonMaterial?(r(m,l),u(m,l)):l.isMeshPhongMaterial?(r(m,l),d(m,l)):l.isMeshStandardMaterial?(r(m,l),f(m,l),l.isMeshPhysicalMaterial&&p(m,l,v)):l.isMeshMatcapMaterial?(r(m,l),g(m,l)):l.isMeshDepthMaterial?r(m,l):l.isMeshDistanceMaterial?(r(m,l),x(m,l)):l.isMeshNormalMaterial?r(m,l):l.isLineBasicMaterial?(o(m,l),l.isLineDashedMaterial&&a(m,l)):l.isPointsMaterial?c(m,l,E,y):l.isSpriteMaterial?h(m,l):l.isShadowMaterial?(m.color.value.copy(l.color),m.opacity.value=l.opacity):l.isShaderMaterial&&(l.uniformsNeedUpdate=!1)}function r(m,l){m.opacity.value=l.opacity,l.color&&m.diffuse.value.copy(l.color),l.emissive&&m.emissive.value.copy(l.emissive).multiplyScalar(l.emissiveIntensity),l.map&&(m.map.value=l.map,e(l.map,m.mapTransform)),l.alphaMap&&(m.alphaMap.value=l.alphaMap,e(l.alphaMap,m.alphaMapTransform)),l.bumpMap&&(m.bumpMap.value=l.bumpMap,e(l.bumpMap,m.bumpMapTransform),m.bumpScale.value=l.bumpScale,l.side===Ue&&(m.bumpScale.value*=-1)),l.normalMap&&(m.normalMap.value=l.normalMap,e(l.normalMap,m.normalMapTransform),m.normalScale.value.copy(l.normalScale),l.side===Ue&&m.normalScale.value.negate()),l.displacementMap&&(m.displacementMap.value=l.displacementMap,e(l.displacementMap,m.displacementMapTransform),m.displacementScale.value=l.displacementScale,m.displacementBias.value=l.displacementBias),l.emissiveMap&&(m.emissiveMap.value=l.emissiveMap,e(l.emissiveMap,m.emissiveMapTransform)),l.specularMap&&(m.specularMap.value=l.specularMap,e(l.specularMap,m.specularMapTransform)),l.alphaTest>0&&(m.alphaTest.value=l.alphaTest);let E=t.get(l),y=E.envMap,v=E.envMapRotation;y&&(m.envMap.value=y,jn.copy(v),jn.x*=-1,jn.y*=-1,jn.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(jn.y*=-1,jn.z*=-1),m.envMapRotation.value.setFromMatrix4(Cm.makeRotationFromEuler(jn)),m.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=l.reflectivity,m.ior.value=l.ior,m.refractionRatio.value=l.refractionRatio),l.lightMap&&(m.lightMap.value=l.lightMap,m.lightMapIntensity.value=l.lightMapIntensity,e(l.lightMap,m.lightMapTransform)),l.aoMap&&(m.aoMap.value=l.aoMap,m.aoMapIntensity.value=l.aoMapIntensity,e(l.aoMap,m.aoMapTransform))}function o(m,l){m.diffuse.value.copy(l.color),m.opacity.value=l.opacity,l.map&&(m.map.value=l.map,e(l.map,m.mapTransform))}function a(m,l){m.dashSize.value=l.dashSize,m.totalSize.value=l.dashSize+l.gapSize,m.scale.value=l.scale}function c(m,l,E,y){m.diffuse.value.copy(l.color),m.opacity.value=l.opacity,m.size.value=l.size*E,m.scale.value=y*.5,l.map&&(m.map.value=l.map,e(l.map,m.uvTransform)),l.alphaMap&&(m.alphaMap.value=l.alphaMap,e(l.alphaMap,m.alphaMapTransform)),l.alphaTest>0&&(m.alphaTest.value=l.alphaTest)}function h(m,l){m.diffuse.value.copy(l.color),m.opacity.value=l.opacity,m.rotation.value=l.rotation,l.map&&(m.map.value=l.map,e(l.map,m.mapTransform)),l.alphaMap&&(m.alphaMap.value=l.alphaMap,e(l.alphaMap,m.alphaMapTransform)),l.alphaTest>0&&(m.alphaTest.value=l.alphaTest)}function d(m,l){m.specular.value.copy(l.specular),m.shininess.value=Math.max(l.shininess,1e-4)}function u(m,l){l.gradientMap&&(m.gradientMap.value=l.gradientMap)}function f(m,l){m.metalness.value=l.metalness,l.metalnessMap&&(m.metalnessMap.value=l.metalnessMap,e(l.metalnessMap,m.metalnessMapTransform)),m.roughness.value=l.roughness,l.roughnessMap&&(m.roughnessMap.value=l.roughnessMap,e(l.roughnessMap,m.roughnessMapTransform)),l.envMap&&(m.envMapIntensity.value=l.envMapIntensity)}function p(m,l,E){m.ior.value=l.ior,l.sheen>0&&(m.sheenColor.value.copy(l.sheenColor).multiplyScalar(l.sheen),m.sheenRoughness.value=l.sheenRoughness,l.sheenColorMap&&(m.sheenColorMap.value=l.sheenColorMap,e(l.sheenColorMap,m.sheenColorMapTransform)),l.sheenRoughnessMap&&(m.sheenRoughnessMap.value=l.sheenRoughnessMap,e(l.sheenRoughnessMap,m.sheenRoughnessMapTransform))),l.clearcoat>0&&(m.clearcoat.value=l.clearcoat,m.clearcoatRoughness.value=l.clearcoatRoughness,l.clearcoatMap&&(m.clearcoatMap.value=l.clearcoatMap,e(l.clearcoatMap,m.clearcoatMapTransform)),l.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=l.clearcoatRoughnessMap,e(l.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),l.clearcoatNormalMap&&(m.clearcoatNormalMap.value=l.clearcoatNormalMap,e(l.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(l.clearcoatNormalScale),l.side===Ue&&m.clearcoatNormalScale.value.negate())),l.dispersion>0&&(m.dispersion.value=l.dispersion),l.iridescence>0&&(m.iridescence.value=l.iridescence,m.iridescenceIOR.value=l.iridescenceIOR,m.iridescenceThicknessMinimum.value=l.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=l.iridescenceThicknessRange[1],l.iridescenceMap&&(m.iridescenceMap.value=l.iridescenceMap,e(l.iridescenceMap,m.iridescenceMapTransform)),l.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=l.iridescenceThicknessMap,e(l.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),l.transmission>0&&(m.transmission.value=l.transmission,m.transmissionSamplerMap.value=E.texture,m.transmissionSamplerSize.value.set(E.width,E.height),l.transmissionMap&&(m.transmissionMap.value=l.transmissionMap,e(l.transmissionMap,m.transmissionMapTransform)),m.thickness.value=l.thickness,l.thicknessMap&&(m.thicknessMap.value=l.thicknessMap,e(l.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=l.attenuationDistance,m.attenuationColor.value.copy(l.attenuationColor)),l.anisotropy>0&&(m.anisotropyVector.value.set(l.anisotropy*Math.cos(l.anisotropyRotation),l.anisotropy*Math.sin(l.anisotropyRotation)),l.anisotropyMap&&(m.anisotropyMap.value=l.anisotropyMap,e(l.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=l.specularIntensity,m.specularColor.value.copy(l.specularColor),l.specularColorMap&&(m.specularColorMap.value=l.specularColorMap,e(l.specularColorMap,m.specularColorMapTransform)),l.specularIntensityMap&&(m.specularIntensityMap.value=l.specularIntensityMap,e(l.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,l){l.matcap&&(m.matcap.value=l.matcap)}function x(m,l){let E=t.get(l).light;m.referencePosition.value.setFromMatrixPosition(E.matrixWorld),m.nearDistance.value=E.shadow.camera.near,m.farDistance.value=E.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Im(i,t,e,n){let s={},r={},o=[],a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(E,y){let v=y.program;n.uniformBlockBinding(E,v)}function h(E,y){let v=s[E.id];v===void 0&&(g(E),v=d(E),s[E.id]=v,E.addEventListener("dispose",m));let D=y.program;n.updateUBOMapping(E,D);let I=t.render.frame;r[E.id]!==I&&(f(E),r[E.id]=I)}function d(E){let y=u();E.__bindingPointIndex=y;let v=i.createBuffer(),D=E.__size,I=E.usage;return i.bindBuffer(i.UNIFORM_BUFFER,v),i.bufferData(i.UNIFORM_BUFFER,D,I),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,y,v),v}function u(){for(let E=0;E<a;E++)if(o.indexOf(E)===-1)return o.push(E),E;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(E){let y=s[E.id],v=E.uniforms,D=E.__cache;i.bindBuffer(i.UNIFORM_BUFFER,y);for(let I=0,P=v.length;I<P;I++){let N=Array.isArray(v[I])?v[I]:[v[I]];for(let w=0,b=N.length;w<b;w++){let U=N[w];if(p(U,I,w,D)===!0){let V=U.__offset,H=Array.isArray(U.value)?U.value:[U.value],W=0;for(let $=0;$<H.length;$++){let G=H[$],rt=x(G);typeof G=="number"||typeof G=="boolean"?(U.__data[0]=G,i.bufferSubData(i.UNIFORM_BUFFER,V+W,U.__data)):G.isMatrix3?(U.__data[0]=G.elements[0],U.__data[1]=G.elements[1],U.__data[2]=G.elements[2],U.__data[3]=0,U.__data[4]=G.elements[3],U.__data[5]=G.elements[4],U.__data[6]=G.elements[5],U.__data[7]=0,U.__data[8]=G.elements[6],U.__data[9]=G.elements[7],U.__data[10]=G.elements[8],U.__data[11]=0):(G.toArray(U.__data,W),W+=rt.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,V,U.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function p(E,y,v,D){let I=E.value,P=y+"_"+v;if(D[P]===void 0)return typeof I=="number"||typeof I=="boolean"?D[P]=I:D[P]=I.clone(),!0;{let N=D[P];if(typeof I=="number"||typeof I=="boolean"){if(N!==I)return D[P]=I,!0}else if(N.equals(I)===!1)return N.copy(I),!0}return!1}function g(E){let y=E.uniforms,v=0,D=16;for(let P=0,N=y.length;P<N;P++){let w=Array.isArray(y[P])?y[P]:[y[P]];for(let b=0,U=w.length;b<U;b++){let V=w[b],H=Array.isArray(V.value)?V.value:[V.value];for(let W=0,$=H.length;W<$;W++){let G=H[W],rt=x(G),q=v%D,ut=q%rt.boundary,Mt=q+ut;v+=ut,Mt!==0&&D-Mt<rt.storage&&(v+=D-Mt),V.__data=new Float32Array(rt.storage/Float32Array.BYTES_PER_ELEMENT),V.__offset=v,v+=rt.storage}}}let I=v%D;return I>0&&(v+=D-I),E.__size=v,E.__cache={},this}function x(E){let y={boundary:0,storage:0};return typeof E=="number"||typeof E=="boolean"?(y.boundary=4,y.storage=4):E.isVector2?(y.boundary=8,y.storage=8):E.isVector3||E.isColor?(y.boundary=16,y.storage=12):E.isVector4?(y.boundary=16,y.storage=16):E.isMatrix3?(y.boundary=48,y.storage=48):E.isMatrix4?(y.boundary=64,y.storage=64):E.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",E),y}function m(E){let y=E.target;y.removeEventListener("dispose",m);let v=o.indexOf(y.__bindingPointIndex);o.splice(v,1),i.deleteBuffer(s[y.id]),delete s[y.id],delete r[y.id]}function l(){for(let E in s)i.deleteBuffer(s[E]);o=[],s={},r={}}return{bind:c,update:h,dispose:l}}var ki=class{constructor(t={}){let{canvas:e=Dh(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:h=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:f=!1}=t;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext!="undefined"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=n.getContextAttributes().alpha}else p=o;let g=new Uint32Array(4),x=new Int32Array(4),m=null,l=null,E=[],y=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=De,this.toneMapping=Bn,this.toneMappingExposure=1;let v=this,D=!1,I=0,P=0,N=null,w=-1,b=null,U=new pe,V=new pe,H=null,W=new ie(0),$=0,G=e.width,rt=e.height,q=1,ut=null,Mt=null,Ct=new pe(0,0,G,rt),Gt=new pe(0,0,G,rt),se=!1,J=new _s,at=!1,Rt=!1,mt=new _e,St=new _e,At=new L,Ft=new pe,ae={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Dt=!1;function te(){return N===null?q:1}let B=n;function we(S,_){return e.getContext(S,_)}try{let S={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:h,powerPreference:d,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Ta}`),e.addEventListener("webglcontextlost",Q,!1),e.addEventListener("webglcontextrestored",gt,!1),e.addEventListener("webglcontextcreationerror",xt,!1),B===null){let _="webgl2";if(B=we(_,S),B===null)throw we(_)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(S){throw console.error("THREE.WebGLRenderer: "+S.message),S}let Kt,$t,Ut,ce,It,R,M,k,j,nt,K,lt,dt,vt,Zt,ot,ht,Tt,Bt,ct,Wt,Nt,Et,F;function ft(){Kt=new qf(B),Kt.init(),Nt=new Em(B,Kt),$t=new kf(B,Kt,t,Nt),Ut=new Mm(B,Kt),$t.reverseDepthBuffer&&f&&Ut.buffers.depth.setReversed(!0),ce=new Zf(B),It=new cm,R=new Sm(B,Kt,Ut,It,$t,Nt,ce),M=new Vf(v),k=new Xf(v),j=new eu(B),Et=new Bf(B,j),nt=new Yf(B,j,ce,Et),K=new Kf(B,nt,j,ce),Bt=new Jf(B,$t,R),ot=new Hf(It),lt=new am(v,M,k,Kt,$t,Et,ot),dt=new Rm(v,It),vt=new hm,Zt=new gm(Kt),Tt=new Ff(v,M,k,Ut,K,p,c),ht=new ym(v,K,$t),F=new Im(B,ce,$t,Ut),ct=new zf(B,Kt,ce),Wt=new $f(B,Kt,ce),ce.programs=lt.programs,v.capabilities=$t,v.extensions=Kt,v.properties=It,v.renderLists=vt,v.shadowMap=ht,v.state=Ut,v.info=ce}ft();let X=new ra(v,B);this.xr=X,this.getContext=function(){return B},this.getContextAttributes=function(){return B.getContextAttributes()},this.forceContextLoss=function(){let S=Kt.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){let S=Kt.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return q},this.setPixelRatio=function(S){S!==void 0&&(q=S,this.setSize(G,rt,!1))},this.getSize=function(S){return S.set(G,rt)},this.setSize=function(S,_,A=!0){if(X.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}G=S,rt=_,e.width=Math.floor(S*q),e.height=Math.floor(_*q),A===!0&&(e.style.width=S+"px",e.style.height=_+"px"),this.setViewport(0,0,S,_)},this.getDrawingBufferSize=function(S){return S.set(G*q,rt*q).floor()},this.setDrawingBufferSize=function(S,_,A){G=S,rt=_,q=A,e.width=Math.floor(S*A),e.height=Math.floor(_*A),this.setViewport(0,0,S,_)},this.getCurrentViewport=function(S){return S.copy(U)},this.getViewport=function(S){return S.copy(Ct)},this.setViewport=function(S,_,A,T){S.isVector4?Ct.set(S.x,S.y,S.z,S.w):Ct.set(S,_,A,T),Ut.viewport(U.copy(Ct).multiplyScalar(q).round())},this.getScissor=function(S){return S.copy(Gt)},this.setScissor=function(S,_,A,T){S.isVector4?Gt.set(S.x,S.y,S.z,S.w):Gt.set(S,_,A,T),Ut.scissor(V.copy(Gt).multiplyScalar(q).round())},this.getScissorTest=function(){return se},this.setScissorTest=function(S){Ut.setScissorTest(se=S)},this.setOpaqueSort=function(S){ut=S},this.setTransparentSort=function(S){Mt=S},this.getClearColor=function(S){return S.copy(Tt.getClearColor())},this.setClearColor=function(){Tt.setClearColor.apply(Tt,arguments)},this.getClearAlpha=function(){return Tt.getClearAlpha()},this.setClearAlpha=function(){Tt.setClearAlpha.apply(Tt,arguments)},this.clear=function(S=!0,_=!0,A=!0){let T=0;if(S){let C=!1;if(N!==null){let z=N.texture.format;C=z===La||z===Pa||z===Ia}if(C){let z=N.texture.type,Z=z===Tn||z===ri||z===ms||z===Fi||z===Ca||z===Ra,st=Tt.getClearColor(),it=Tt.getClearAlpha(),bt=st.r,Ot=st.g,_t=st.b;Z?(g[0]=bt,g[1]=Ot,g[2]=_t,g[3]=it,B.clearBufferuiv(B.COLOR,0,g)):(x[0]=bt,x[1]=Ot,x[2]=_t,x[3]=it,B.clearBufferiv(B.COLOR,0,x))}else T|=B.COLOR_BUFFER_BIT}_&&(T|=B.DEPTH_BUFFER_BIT),A&&(T|=B.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),B.clear(T)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",Q,!1),e.removeEventListener("webglcontextrestored",gt,!1),e.removeEventListener("webglcontextcreationerror",xt,!1),vt.dispose(),Zt.dispose(),It.dispose(),M.dispose(),k.dispose(),K.dispose(),Et.dispose(),F.dispose(),lt.dispose(),X.dispose(),X.removeEventListener("sessionstart",Me),X.removeEventListener("sessionend",Xe),O.stop()};function Q(S){S.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),D=!0}function gt(){console.log("THREE.WebGLRenderer: Context Restored."),D=!1;let S=ce.autoReset,_=ht.enabled,A=ht.autoUpdate,T=ht.needsUpdate,C=ht.type;ft(),ce.autoReset=S,ht.enabled=_,ht.autoUpdate=A,ht.needsUpdate=T,ht.type=C}function xt(S){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function zt(S){let _=S.target;_.removeEventListener("dispose",zt),ue(_)}function ue(S){ve(S),It.remove(S)}function ve(S){let _=It.get(S).programs;_!==void 0&&(_.forEach(function(A){lt.releaseProgram(A)}),S.isShaderMaterial&&lt.releaseShaderCache(S))}this.renderBufferDirect=function(S,_,A,T,C,z){_===null&&(_=ae);let Z=C.isMesh&&C.matrixWorld.determinant()<0,st=ee(S,_,A,T,C);Ut.setMaterial(T,Z);let it=A.index,bt=1;if(T.wireframe===!0){if(it=nt.getWireframeAttribute(A),it===void 0)return;bt=2}let Ot=A.drawRange,_t=A.attributes.position,jt=Ot.start*bt,re=(Ot.start+Ot.count)*bt;z!==null&&(jt=Math.max(jt,z.start*bt),re=Math.min(re,(z.start+z.count)*bt)),it!==null?(jt=Math.max(jt,0),re=Math.min(re,it.count)):_t!=null&&(jt=Math.max(jt,0),re=Math.min(re,_t.count));let Ht=re-jt;if(Ht<0||Ht===1/0)return;Et.setup(C,T,st,A,it);let me,qt=ct;if(it!==null&&(me=j.get(it),qt=Wt,qt.setIndex(me)),C.isMesh)T.wireframe===!0?(Ut.setLineWidth(T.wireframeLinewidth*te()),qt.setMode(B.LINES)):qt.setMode(B.TRIANGLES);else if(C.isLine){let Lt=T.linewidth;Lt===void 0&&(Lt=1),Ut.setLineWidth(Lt*te()),C.isLineSegments?qt.setMode(B.LINES):C.isLineLoop?qt.setMode(B.LINE_LOOP):qt.setMode(B.LINE_STRIP)}else C.isPoints?qt.setMode(B.POINTS):C.isSprite&&qt.setMode(B.TRIANGLES);if(C.isBatchedMesh)if(C._multiDrawInstances!==null)qt.renderMultiDrawInstances(C._multiDrawStarts,C._multiDrawCounts,C._multiDrawCount,C._multiDrawInstances);else if(Kt.get("WEBGL_multi_draw"))qt.renderMultiDraw(C._multiDrawStarts,C._multiDrawCounts,C._multiDrawCount);else{let Lt=C._multiDrawStarts,je=C._multiDrawCounts,de=C._multiDrawCount,Qe=it?j.get(it).bytesPerElement:1,fi=It.get(T).currentProgram.getUniforms();for(let Ve=0;Ve<de;Ve++)fi.setValue(B,"_gl_DrawID",Ve),qt.render(Lt[Ve]/Qe,je[Ve])}else if(C.isInstancedMesh)qt.renderInstances(jt,Ht,C.count);else if(A.isInstancedBufferGeometry){let Lt=A._maxInstanceCount!==void 0?A._maxInstanceCount:1/0,je=Math.min(A.instanceCount,Lt);qt.renderInstances(jt,Ht,je)}else qt.render(jt,Ht)};function ne(S,_,A){S.transparent===!0&&S.side===sn&&S.forceSinglePass===!1?(S.side=Ue,S.needsUpdate=!0,wt(S,_,A),S.side=zn,S.needsUpdate=!0,wt(S,_,A),S.side=sn):wt(S,_,A)}this.compile=function(S,_,A=null){A===null&&(A=S),l=Zt.get(A),l.init(_),y.push(l),A.traverseVisible(function(C){C.isLight&&C.layers.test(_.layers)&&(l.pushLight(C),C.castShadow&&l.pushShadow(C))}),S!==A&&S.traverseVisible(function(C){C.isLight&&C.layers.test(_.layers)&&(l.pushLight(C),C.castShadow&&l.pushShadow(C))}),l.setupLights();let T=new Set;return S.traverse(function(C){if(!(C.isMesh||C.isPoints||C.isLine||C.isSprite))return;let z=C.material;if(z)if(Array.isArray(z))for(let Z=0;Z<z.length;Z++){let st=z[Z];ne(st,A,C),T.add(st)}else ne(z,A,C),T.add(z)}),y.pop(),l=null,T},this.compileAsync=function(S,_,A=null){let T=this.compile(S,_,A);return new Promise(C=>{function z(){if(T.forEach(function(Z){It.get(Z).currentProgram.isReady()&&T.delete(Z)}),T.size===0){C(S);return}setTimeout(z,10)}Kt.get("KHR_parallel_shader_compile")!==null?z():setTimeout(z,10)})};let Te=null;function ze(S){Te&&Te(S)}function Me(){O.stop()}function Xe(){O.start()}let O=new ml;O.setAnimationLoop(ze),typeof self!="undefined"&&O.setContext(self),this.setAnimationLoop=function(S){Te=S,X.setAnimationLoop(S),S===null?O.stop():O.start()},X.addEventListener("sessionstart",Me),X.addEventListener("sessionend",Xe),this.render=function(S,_){if(_!==void 0&&_.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;if(S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),_.parent===null&&_.matrixWorldAutoUpdate===!0&&_.updateMatrixWorld(),X.enabled===!0&&X.isPresenting===!0&&(X.cameraAutoUpdate===!0&&X.updateCamera(_),_=X.getCamera()),S.isScene===!0&&S.onBeforeRender(v,S,_,N),l=Zt.get(S,y.length),l.init(_),y.push(l),St.multiplyMatrices(_.projectionMatrix,_.matrixWorldInverse),J.setFromProjectionMatrix(St),Rt=this.localClippingEnabled,at=ot.init(this.clippingPlanes,Rt),m=vt.get(S,E.length),m.init(),E.push(m),X.enabled===!0&&X.isPresenting===!0){let z=v.xr.getDepthSensingMesh();z!==null&&Y(z,_,-1/0,v.sortObjects)}Y(S,_,0,v.sortObjects),m.finish(),v.sortObjects===!0&&m.sort(ut,Mt),Dt=X.enabled===!1||X.isPresenting===!1||X.hasDepthSensing()===!1,Dt&&Tt.addToRenderList(m,S),this.info.render.frame++,at===!0&&ot.beginShadows();let A=l.state.shadowsArray;ht.render(A,S,_),at===!0&&ot.endShadows(),this.info.autoReset===!0&&this.info.reset();let T=m.opaque,C=m.transmissive;if(l.setupLights(),_.isArrayCamera){let z=_.cameras;if(C.length>0)for(let Z=0,st=z.length;Z<st;Z++){let it=z[Z];pt(T,C,S,it)}Dt&&Tt.render(S);for(let Z=0,st=z.length;Z<st;Z++){let it=z[Z];et(m,S,it,it.viewport)}}else C.length>0&&pt(T,C,S,_),Dt&&Tt.render(S),et(m,S,_);N!==null&&(R.updateMultisampleRenderTarget(N),R.updateRenderTargetMipmap(N)),S.isScene===!0&&S.onAfterRender(v,S,_),Et.resetDefaultState(),w=-1,b=null,y.pop(),y.length>0?(l=y[y.length-1],at===!0&&ot.setGlobalState(v.clippingPlanes,l.state.camera)):l=null,E.pop(),E.length>0?m=E[E.length-1]:m=null};function Y(S,_,A,T){if(S.visible===!1)return;if(S.layers.test(_.layers)){if(S.isGroup)A=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(_);else if(S.isLight)l.pushLight(S),S.castShadow&&l.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||J.intersectsSprite(S)){T&&Ft.setFromMatrixPosition(S.matrixWorld).applyMatrix4(St);let Z=K.update(S),st=S.material;st.visible&&m.push(S,Z,st,A,Ft.z,null)}}else if((S.isMesh||S.isLine||S.isPoints)&&(!S.frustumCulled||J.intersectsObject(S))){let Z=K.update(S),st=S.material;if(T&&(S.boundingSphere!==void 0?(S.boundingSphere===null&&S.computeBoundingSphere(),Ft.copy(S.boundingSphere.center)):(Z.boundingSphere===null&&Z.computeBoundingSphere(),Ft.copy(Z.boundingSphere.center)),Ft.applyMatrix4(S.matrixWorld).applyMatrix4(St)),Array.isArray(st)){let it=Z.groups;for(let bt=0,Ot=it.length;bt<Ot;bt++){let _t=it[bt],jt=st[_t.materialIndex];jt&&jt.visible&&m.push(S,Z,jt,A,Ft.z,_t)}}else st.visible&&m.push(S,Z,st,A,Ft.z,null)}}let z=S.children;for(let Z=0,st=z.length;Z<st;Z++)Y(z[Z],_,A,T)}function et(S,_,A,T){let C=S.opaque,z=S.transmissive,Z=S.transparent;l.setupLightsView(A),at===!0&&ot.setGlobalState(v.clippingPlanes,A),T&&Ut.viewport(U.copy(T)),C.length>0&&Pt(C,_,A),z.length>0&&Pt(z,_,A),Z.length>0&&Pt(Z,_,A),Ut.buffers.depth.setTest(!0),Ut.buffers.depth.setMask(!0),Ut.buffers.color.setMask(!0),Ut.setPolygonOffset(!1)}function pt(S,_,A,T){if((A.isScene===!0?A.overrideMaterial:null)!==null)return;l.state.transmissionRenderTarget[T.id]===void 0&&(l.state.transmissionRenderTarget[T.id]=new An(1,1,{generateMipmaps:!0,type:Kt.has("EXT_color_buffer_half_float")||Kt.has("EXT_color_buffer_float")?Ms:Tn,minFilter:si,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:oe.workingColorSpace}));let z=l.state.transmissionRenderTarget[T.id],Z=T.viewport||U;z.setSize(Z.z,Z.w);let st=v.getRenderTarget();v.setRenderTarget(z),v.getClearColor(W),$=v.getClearAlpha(),$<1&&v.setClearColor(16777215,.5),v.clear(),Dt&&Tt.render(A);let it=v.toneMapping;v.toneMapping=Bn;let bt=T.viewport;if(T.viewport!==void 0&&(T.viewport=void 0),l.setupLightsView(T),at===!0&&ot.setGlobalState(v.clippingPlanes,T),Pt(S,A,T),R.updateMultisampleRenderTarget(z),R.updateRenderTargetMipmap(z),Kt.has("WEBGL_multisampled_render_to_texture")===!1){let Ot=!1;for(let _t=0,jt=_.length;_t<jt;_t++){let re=_[_t],Ht=re.object,me=re.geometry,qt=re.material,Lt=re.group;if(qt.side===sn&&Ht.layers.test(T.layers)){let je=qt.side;qt.side=Ue,qt.needsUpdate=!0,Vt(Ht,A,T,me,qt,Lt),qt.side=je,qt.needsUpdate=!0,Ot=!0}}Ot===!0&&(R.updateMultisampleRenderTarget(z),R.updateRenderTargetMipmap(z))}v.setRenderTarget(st),v.setClearColor(W,$),bt!==void 0&&(T.viewport=bt),v.toneMapping=it}function Pt(S,_,A){let T=_.isScene===!0?_.overrideMaterial:null;for(let C=0,z=S.length;C<z;C++){let Z=S[C],st=Z.object,it=Z.geometry,bt=T===null?Z.material:T,Ot=Z.group;st.layers.test(A.layers)&&Vt(st,_,A,it,bt,Ot)}}function Vt(S,_,A,T,C,z){S.onBeforeRender(v,_,A,T,C,z),S.modelViewMatrix.multiplyMatrices(A.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),C.onBeforeRender(v,_,A,T,S,z),C.transparent===!0&&C.side===sn&&C.forceSinglePass===!1?(C.side=Ue,C.needsUpdate=!0,v.renderBufferDirect(A,_,T,C,S,z),C.side=zn,C.needsUpdate=!0,v.renderBufferDirect(A,_,T,C,S,z),C.side=sn):v.renderBufferDirect(A,_,T,C,S,z),S.onAfterRender(v,_,A,T,C,z)}function wt(S,_,A){_.isScene!==!0&&(_=ae);let T=It.get(S),C=l.state.lights,z=l.state.shadowsArray,Z=C.state.version,st=lt.getParameters(S,C.state,z,_,A),it=lt.getProgramCacheKey(st),bt=T.programs;T.environment=S.isMeshStandardMaterial?_.environment:null,T.fog=_.fog,T.envMap=(S.isMeshStandardMaterial?k:M).get(S.envMap||T.environment),T.envMapRotation=T.environment!==null&&S.envMap===null?_.environmentRotation:S.envMapRotation,bt===void 0&&(S.addEventListener("dispose",zt),bt=new Map,T.programs=bt);let Ot=bt.get(it);if(Ot!==void 0){if(T.currentProgram===Ot&&T.lightsStateVersion===Z)return Xt(S,st),Ot}else st.uniforms=lt.getUniforms(S),S.onBeforeCompile(st,v),Ot=lt.acquireProgram(st,it),bt.set(it,Ot),T.uniforms=st.uniforms;let _t=T.uniforms;return(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(_t.clippingPlanes=ot.uniform),Xt(S,st),T.needsLights=Ne(S),T.lightsStateVersion=Z,T.needsLights&&(_t.ambientLightColor.value=C.state.ambient,_t.lightProbe.value=C.state.probe,_t.directionalLights.value=C.state.directional,_t.directionalLightShadows.value=C.state.directionalShadow,_t.spotLights.value=C.state.spot,_t.spotLightShadows.value=C.state.spotShadow,_t.rectAreaLights.value=C.state.rectArea,_t.ltc_1.value=C.state.rectAreaLTC1,_t.ltc_2.value=C.state.rectAreaLTC2,_t.pointLights.value=C.state.point,_t.pointLightShadows.value=C.state.pointShadow,_t.hemisphereLights.value=C.state.hemi,_t.directionalShadowMap.value=C.state.directionalShadowMap,_t.directionalShadowMatrix.value=C.state.directionalShadowMatrix,_t.spotShadowMap.value=C.state.spotShadowMap,_t.spotLightMatrix.value=C.state.spotLightMatrix,_t.spotLightMap.value=C.state.spotLightMap,_t.pointShadowMap.value=C.state.pointShadowMap,_t.pointShadowMatrix.value=C.state.pointShadowMatrix),T.currentProgram=Ot,T.uniformsList=null,Ot}function le(S){if(S.uniformsList===null){let _=S.currentProgram.getUniforms();S.uniformsList=Di.seqWithValue(_.seq,S.uniforms)}return S.uniformsList}function Xt(S,_){let A=It.get(S);A.outputColorSpace=_.outputColorSpace,A.batching=_.batching,A.batchingColor=_.batchingColor,A.instancing=_.instancing,A.instancingColor=_.instancingColor,A.instancingMorph=_.instancingMorph,A.skinning=_.skinning,A.morphTargets=_.morphTargets,A.morphNormals=_.morphNormals,A.morphColors=_.morphColors,A.morphTargetsCount=_.morphTargetsCount,A.numClippingPlanes=_.numClippingPlanes,A.numIntersection=_.numClipIntersection,A.vertexAlphas=_.vertexAlphas,A.vertexTangents=_.vertexTangents,A.toneMapping=_.toneMapping}function ee(S,_,A,T,C){_.isScene!==!0&&(_=ae),R.resetTextureUnits();let z=_.fog,Z=T.isMeshStandardMaterial?_.environment:null,st=N===null?v.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:Yi,it=(T.isMeshStandardMaterial?k:M).get(T.envMap||Z),bt=T.vertexColors===!0&&!!A.attributes.color&&A.attributes.color.itemSize===4,Ot=!!A.attributes.tangent&&(!!T.normalMap||T.anisotropy>0),_t=!!A.morphAttributes.position,jt=!!A.morphAttributes.normal,re=!!A.morphAttributes.color,Ht=Bn;T.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(Ht=v.toneMapping);let me=A.morphAttributes.position||A.morphAttributes.normal||A.morphAttributes.color,qt=me!==void 0?me.length:0,Lt=It.get(T),je=l.state.lights;if(at===!0&&(Rt===!0||S!==b)){let qe=S===b&&T.id===w;ot.setState(T,S,qe)}let de=!1;T.version===Lt.__version?(Lt.needsLights&&Lt.lightsStateVersion!==je.state.version||Lt.outputColorSpace!==st||C.isBatchedMesh&&Lt.batching===!1||!C.isBatchedMesh&&Lt.batching===!0||C.isBatchedMesh&&Lt.batchingColor===!0&&C.colorTexture===null||C.isBatchedMesh&&Lt.batchingColor===!1&&C.colorTexture!==null||C.isInstancedMesh&&Lt.instancing===!1||!C.isInstancedMesh&&Lt.instancing===!0||C.isSkinnedMesh&&Lt.skinning===!1||!C.isSkinnedMesh&&Lt.skinning===!0||C.isInstancedMesh&&Lt.instancingColor===!0&&C.instanceColor===null||C.isInstancedMesh&&Lt.instancingColor===!1&&C.instanceColor!==null||C.isInstancedMesh&&Lt.instancingMorph===!0&&C.morphTexture===null||C.isInstancedMesh&&Lt.instancingMorph===!1&&C.morphTexture!==null||Lt.envMap!==it||T.fog===!0&&Lt.fog!==z||Lt.numClippingPlanes!==void 0&&(Lt.numClippingPlanes!==ot.numPlanes||Lt.numIntersection!==ot.numIntersection)||Lt.vertexAlphas!==bt||Lt.vertexTangents!==Ot||Lt.morphTargets!==_t||Lt.morphNormals!==jt||Lt.morphColors!==re||Lt.toneMapping!==Ht||Lt.morphTargetsCount!==qt)&&(de=!0):(de=!0,Lt.__version=T.version);let Qe=Lt.currentProgram;de===!0&&(Qe=wt(T,_,C));let fi=!1,Ve=!1,es=!1,ge=Qe.getUniforms(),hn=Lt.uniforms;if(Ut.useProgram(Qe.program)&&(fi=!0,Ve=!0,es=!0),T.id!==w&&(w=T.id,Ve=!0),fi||b!==S){Ut.buffers.depth.getReversed()?(mt.copy(S.projectionMatrix),Nh(mt),Oh(mt),ge.setValue(B,"projectionMatrix",mt)):ge.setValue(B,"projectionMatrix",S.projectionMatrix),ge.setValue(B,"viewMatrix",S.matrixWorldInverse);let Cn=ge.map.cameraPosition;Cn!==void 0&&Cn.setValue(B,At.setFromMatrixPosition(S.matrixWorld)),$t.logarithmicDepthBuffer&&ge.setValue(B,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),(T.isMeshPhongMaterial||T.isMeshToonMaterial||T.isMeshLambertMaterial||T.isMeshBasicMaterial||T.isMeshStandardMaterial||T.isShaderMaterial)&&ge.setValue(B,"isOrthographic",S.isOrthographicCamera===!0),b!==S&&(b=S,Ve=!0,es=!0)}if(C.isSkinnedMesh){ge.setOptional(B,C,"bindMatrix"),ge.setOptional(B,C,"bindMatrixInverse");let qe=C.skeleton;qe&&(qe.boneTexture===null&&qe.computeBoneTexture(),ge.setValue(B,"boneTexture",qe.boneTexture,R))}C.isBatchedMesh&&(ge.setOptional(B,C,"batchingTexture"),ge.setValue(B,"batchingTexture",C._matricesTexture,R),ge.setOptional(B,C,"batchingIdTexture"),ge.setValue(B,"batchingIdTexture",C._indirectTexture,R),ge.setOptional(B,C,"batchingColorTexture"),C._colorsTexture!==null&&ge.setValue(B,"batchingColorTexture",C._colorsTexture,R));let ns=A.morphAttributes;if((ns.position!==void 0||ns.normal!==void 0||ns.color!==void 0)&&Bt.update(C,A,Qe),(Ve||Lt.receiveShadow!==C.receiveShadow)&&(Lt.receiveShadow=C.receiveShadow,ge.setValue(B,"receiveShadow",C.receiveShadow)),T.isMeshGouraudMaterial&&T.envMap!==null&&(hn.envMap.value=it,hn.flipEnvMap.value=it.isCubeTexture&&it.isRenderTargetTexture===!1?-1:1),T.isMeshStandardMaterial&&T.envMap===null&&_.environment!==null&&(hn.envMapIntensity.value=_.environmentIntensity),Ve&&(ge.setValue(B,"toneMappingExposure",v.toneMappingExposure),Lt.needsLights&&he(hn,es),z&&T.fog===!0&&dt.refreshFogUniforms(hn,z),dt.refreshMaterialUniforms(hn,T,q,rt,l.state.transmissionRenderTarget[S.id]),Di.upload(B,le(Lt),hn,R)),T.isShaderMaterial&&T.uniformsNeedUpdate===!0&&(Di.upload(B,le(Lt),hn,R),T.uniformsNeedUpdate=!1),T.isSpriteMaterial&&ge.setValue(B,"center",C.center),ge.setValue(B,"modelViewMatrix",C.modelViewMatrix),ge.setValue(B,"normalMatrix",C.normalMatrix),ge.setValue(B,"modelMatrix",C.matrixWorld),T.isShaderMaterial||T.isRawShaderMaterial){let qe=T.uniformsGroups;for(let Cn=0,Rn=qe.length;Cn<Rn;Cn++){let Xa=qe[Cn];F.update(Xa,Qe),F.bind(Xa,Qe)}}return Qe}function he(S,_){S.ambientLightColor.needsUpdate=_,S.lightProbe.needsUpdate=_,S.directionalLights.needsUpdate=_,S.directionalLightShadows.needsUpdate=_,S.pointLights.needsUpdate=_,S.pointLightShadows.needsUpdate=_,S.spotLights.needsUpdate=_,S.spotLightShadows.needsUpdate=_,S.rectAreaLights.needsUpdate=_,S.hemisphereLights.needsUpdate=_}function Ne(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return I},this.getActiveMipmapLevel=function(){return P},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(S,_,A){It.get(S.texture).__webglTexture=_,It.get(S.depthTexture).__webglTexture=A;let T=It.get(S);T.__hasExternalTextures=!0,T.__autoAllocateDepthBuffer=A===void 0,T.__autoAllocateDepthBuffer||Kt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),T.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(S,_){let A=It.get(S);A.__webglFramebuffer=_,A.__useDefaultFramebuffer=_===void 0},this.setRenderTarget=function(S,_=0,A=0){N=S,I=_,P=A;let T=!0,C=null,z=!1,Z=!1;if(S){let it=It.get(S);if(it.__useDefaultFramebuffer!==void 0)Ut.bindFramebuffer(B.FRAMEBUFFER,null),T=!1;else if(it.__webglFramebuffer===void 0)R.setupRenderTarget(S);else if(it.__hasExternalTextures)R.rebindTextures(S,It.get(S.texture).__webglTexture,It.get(S.depthTexture).__webglTexture);else if(S.depthBuffer){let _t=S.depthTexture;if(it.__boundDepthTexture!==_t){if(_t!==null&&It.has(_t)&&(S.width!==_t.image.width||S.height!==_t.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");R.setupDepthRenderbuffer(S)}}let bt=S.texture;(bt.isData3DTexture||bt.isDataArrayTexture||bt.isCompressedArrayTexture)&&(Z=!0);let Ot=It.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(Array.isArray(Ot[_])?C=Ot[_][A]:C=Ot[_],z=!0):S.samples>0&&R.useMultisampledRTT(S)===!1?C=It.get(S).__webglMultisampledFramebuffer:Array.isArray(Ot)?C=Ot[A]:C=Ot,U.copy(S.viewport),V.copy(S.scissor),H=S.scissorTest}else U.copy(Ct).multiplyScalar(q).floor(),V.copy(Gt).multiplyScalar(q).floor(),H=se;if(Ut.bindFramebuffer(B.FRAMEBUFFER,C)&&T&&Ut.drawBuffers(S,C),Ut.viewport(U),Ut.scissor(V),Ut.setScissorTest(H),z){let it=It.get(S.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_CUBE_MAP_POSITIVE_X+_,it.__webglTexture,A)}else if(Z){let it=It.get(S.texture),bt=_||0;B.framebufferTextureLayer(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,it.__webglTexture,A||0,bt)}w=-1},this.readRenderTargetPixels=function(S,_,A,T,C,z,Z){if(!(S&&S.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let st=It.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&Z!==void 0&&(st=st[Z]),st){Ut.bindFramebuffer(B.FRAMEBUFFER,st);try{let it=S.texture,bt=it.format,Ot=it.type;if(!$t.textureFormatReadable(bt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!$t.textureTypeReadable(Ot)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}_>=0&&_<=S.width-T&&A>=0&&A<=S.height-C&&B.readPixels(_,A,T,C,Nt.convert(bt),Nt.convert(Ot),z)}finally{let it=N!==null?It.get(N).__webglFramebuffer:null;Ut.bindFramebuffer(B.FRAMEBUFFER,it)}}},this.readRenderTargetPixelsAsync=async function(S,_,A,T,C,z,Z){if(!(S&&S.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let st=It.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&Z!==void 0&&(st=st[Z]),st){let it=S.texture,bt=it.format,Ot=it.type;if(!$t.textureFormatReadable(bt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!$t.textureTypeReadable(Ot))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(_>=0&&_<=S.width-T&&A>=0&&A<=S.height-C){Ut.bindFramebuffer(B.FRAMEBUFFER,st);let _t=B.createBuffer();B.bindBuffer(B.PIXEL_PACK_BUFFER,_t),B.bufferData(B.PIXEL_PACK_BUFFER,z.byteLength,B.STREAM_READ),B.readPixels(_,A,T,C,Nt.convert(bt),Nt.convert(Ot),0);let jt=N!==null?It.get(N).__webglFramebuffer:null;Ut.bindFramebuffer(B.FRAMEBUFFER,jt);let re=B.fenceSync(B.SYNC_GPU_COMMANDS_COMPLETE,0);return B.flush(),await Uh(B,re,4),B.bindBuffer(B.PIXEL_PACK_BUFFER,_t),B.getBufferSubData(B.PIXEL_PACK_BUFFER,0,z),B.deleteBuffer(_t),B.deleteSync(re),z}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(S,_=null,A=0){S.isTexture!==!0&&(cs("WebGLRenderer: copyFramebufferToTexture function signature has changed."),_=arguments[0]||null,S=arguments[1]);let T=Math.pow(2,-A),C=Math.floor(S.image.width*T),z=Math.floor(S.image.height*T),Z=_!==null?_.x:0,st=_!==null?_.y:0;R.setTexture2D(S,0),B.copyTexSubImage2D(B.TEXTURE_2D,A,0,0,Z,st,C,z),Ut.unbindTexture()},this.copyTextureToTexture=function(S,_,A=null,T=null,C=0){S.isTexture!==!0&&(cs("WebGLRenderer: copyTextureToTexture function signature has changed."),T=arguments[0]||null,S=arguments[1],_=arguments[2],C=arguments[3]||0,A=null);let z,Z,st,it,bt,Ot,_t,jt,re,Ht=S.isCompressedTexture?S.mipmaps[C]:S.image;A!==null?(z=A.max.x-A.min.x,Z=A.max.y-A.min.y,st=A.isBox3?A.max.z-A.min.z:1,it=A.min.x,bt=A.min.y,Ot=A.isBox3?A.min.z:0):(z=Ht.width,Z=Ht.height,st=Ht.depth||1,it=0,bt=0,Ot=0),T!==null?(_t=T.x,jt=T.y,re=T.z):(_t=0,jt=0,re=0);let me=Nt.convert(_.format),qt=Nt.convert(_.type),Lt;_.isData3DTexture?(R.setTexture3D(_,0),Lt=B.TEXTURE_3D):_.isDataArrayTexture||_.isCompressedArrayTexture?(R.setTexture2DArray(_,0),Lt=B.TEXTURE_2D_ARRAY):(R.setTexture2D(_,0),Lt=B.TEXTURE_2D),B.pixelStorei(B.UNPACK_FLIP_Y_WEBGL,_.flipY),B.pixelStorei(B.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),B.pixelStorei(B.UNPACK_ALIGNMENT,_.unpackAlignment);let je=B.getParameter(B.UNPACK_ROW_LENGTH),de=B.getParameter(B.UNPACK_IMAGE_HEIGHT),Qe=B.getParameter(B.UNPACK_SKIP_PIXELS),fi=B.getParameter(B.UNPACK_SKIP_ROWS),Ve=B.getParameter(B.UNPACK_SKIP_IMAGES);B.pixelStorei(B.UNPACK_ROW_LENGTH,Ht.width),B.pixelStorei(B.UNPACK_IMAGE_HEIGHT,Ht.height),B.pixelStorei(B.UNPACK_SKIP_PIXELS,it),B.pixelStorei(B.UNPACK_SKIP_ROWS,bt),B.pixelStorei(B.UNPACK_SKIP_IMAGES,Ot);let es=S.isDataArrayTexture||S.isData3DTexture,ge=_.isDataArrayTexture||_.isData3DTexture;if(S.isRenderTargetTexture||S.isDepthTexture){let hn=It.get(S),ns=It.get(_),qe=It.get(hn.__renderTarget),Cn=It.get(ns.__renderTarget);Ut.bindFramebuffer(B.READ_FRAMEBUFFER,qe.__webglFramebuffer),Ut.bindFramebuffer(B.DRAW_FRAMEBUFFER,Cn.__webglFramebuffer);for(let Rn=0;Rn<st;Rn++)es&&B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,It.get(S).__webglTexture,C,Ot+Rn),S.isDepthTexture?(ge&&B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,It.get(_).__webglTexture,C,re+Rn),B.blitFramebuffer(it,bt,z,Z,_t,jt,z,Z,B.DEPTH_BUFFER_BIT,B.NEAREST)):ge?B.copyTexSubImage3D(Lt,C,_t,jt,re+Rn,it,bt,z,Z):B.copyTexSubImage2D(Lt,C,_t,jt,re+Rn,it,bt,z,Z);Ut.bindFramebuffer(B.READ_FRAMEBUFFER,null),Ut.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else ge?S.isDataTexture||S.isData3DTexture?B.texSubImage3D(Lt,C,_t,jt,re,z,Z,st,me,qt,Ht.data):_.isCompressedArrayTexture?B.compressedTexSubImage3D(Lt,C,_t,jt,re,z,Z,st,me,Ht.data):B.texSubImage3D(Lt,C,_t,jt,re,z,Z,st,me,qt,Ht):S.isDataTexture?B.texSubImage2D(B.TEXTURE_2D,C,_t,jt,z,Z,me,qt,Ht.data):S.isCompressedTexture?B.compressedTexSubImage2D(B.TEXTURE_2D,C,_t,jt,Ht.width,Ht.height,me,Ht.data):B.texSubImage2D(B.TEXTURE_2D,C,_t,jt,z,Z,me,qt,Ht);B.pixelStorei(B.UNPACK_ROW_LENGTH,je),B.pixelStorei(B.UNPACK_IMAGE_HEIGHT,de),B.pixelStorei(B.UNPACK_SKIP_PIXELS,Qe),B.pixelStorei(B.UNPACK_SKIP_ROWS,fi),B.pixelStorei(B.UNPACK_SKIP_IMAGES,Ve),C===0&&_.generateMipmaps&&B.generateMipmap(Lt),Ut.unbindTexture()},this.copyTextureToTexture3D=function(S,_,A=null,T=null,C=0){return S.isTexture!==!0&&(cs("WebGLRenderer: copyTextureToTexture3D function signature has changed."),A=arguments[0]||null,T=arguments[1]||null,S=arguments[2],_=arguments[3],C=arguments[4]||0),cs('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(S,_,A,T,C)},this.initRenderTarget=function(S){It.get(S).__webglFramebuffer===void 0&&R.setupRenderTarget(S)},this.initTexture=function(S){S.isCubeTexture?R.setTextureCube(S,0):S.isData3DTexture?R.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?R.setTexture2DArray(S,0):R.setTexture2D(S,0),Ut.unbindTexture()},this.resetState=function(){I=0,P=0,N=null,Ut.reset(),Et.reset()},typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return En}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorspace=oe._getDrawingBufferColorSpace(t),e.unpackColorSpace=oe._getUnpackColorSpace()}};var Gn=class extends Be{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new fn,this.environmentIntensity=1,this.environmentRotation=new fn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}};var an=class{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){let n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){let e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){let e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){let t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let e=[],n,s=this.getPoint(0),r=0;e.push(0);for(let o=1;o<=t;o++)n=this.getPoint(o/t),r+=n.distanceTo(s),e.push(r),s=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){let n=this.getLengths(),s=0,r=n.length,o;e?o=e:o=t*n[r-1];let a=0,c=r-1,h;for(;a<=c;)if(s=Math.floor(a+(c-a)/2),h=n[s]-o,h<0)a=s+1;else if(h>0)c=s-1;else{c=s;break}if(s=c,n[s]===o)return s/(r-1);let d=n[s],f=n[s+1]-d,p=(o-d)/f;return(s+p)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);let o=this.getPoint(s),a=this.getPoint(r),c=e||(o.isVector2?new kt:new L);return c.copy(a).sub(o).normalize(),c}getTangentAt(t,e){let n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e){let n=new L,s=[],r=[],o=[],a=new L,c=new _e;for(let p=0;p<=t;p++){let g=p/t;s[p]=this.getTangentAt(g,new L)}r[0]=new L,o[0]=new L;let h=Number.MAX_VALUE,d=Math.abs(s[0].x),u=Math.abs(s[0].y),f=Math.abs(s[0].z);d<=h&&(h=d,n.set(1,0,0)),u<=h&&(h=u,n.set(0,1,0)),f<=h&&n.set(0,0,1),a.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let p=1;p<=t;p++){if(r[p]=r[p-1].clone(),o[p]=o[p-1].clone(),a.crossVectors(s[p-1],s[p]),a.length()>Number.EPSILON){a.normalize();let g=Math.acos(Ce(s[p-1].dot(s[p]),-1,1));r[p].applyMatrix4(c.makeRotationAxis(a,g))}o[p].crossVectors(s[p],r[p])}if(e===!0){let p=Math.acos(Ce(r[0].dot(r[t]),-1,1));p/=t,s[0].dot(a.crossVectors(r[0],r[t]))>0&&(p=-p);for(let g=1;g<=t;g++)r[g].applyMatrix4(c.makeRotationAxis(s[g],p*g)),o[g].crossVectors(s[g],r[g])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){let t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}},dr=class extends an{constructor(t=0,e=0,n=1,s=1,r=0,o=Math.PI*2,a=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=c}getPoint(t,e=new kt){let n=e,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);let a=this.aStartAngle+t*r,c=this.aX+this.xRadius*Math.cos(a),h=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let d=Math.cos(this.aRotation),u=Math.sin(this.aRotation),f=c-this.aX,p=h-this.aY;c=f*d-p*u+this.aX,h=f*u+p*d+this.aY}return n.set(c,h)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){let t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}},oa=class extends dr{constructor(t,e,n,s,r,o){super(t,e,n,n,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function Na(){let i=0,t=0,e=0,n=0;function s(r,o,a,c){i=r,t=a,e=-3*r+3*o-2*a-c,n=2*r-2*o+a+c}return{initCatmullRom:function(r,o,a,c,h){s(o,a,h*(a-r),h*(c-o))},initNonuniformCatmullRom:function(r,o,a,c,h,d,u){let f=(o-r)/h-(a-r)/(h+d)+(a-o)/d,p=(a-o)/d-(c-o)/(d+u)+(c-a)/u;f*=d,p*=d,s(o,a,f,p)},calc:function(r){let o=r*r,a=o*r;return i+t*r+e*o+n*a}}}var qs=new L,Kr=new Na,jr=new Na,Qr=new Na,aa=class extends an{constructor(t=[],e=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=s}getPoint(t,e=new L){let n=e,s=this.points,r=s.length,o=(r-(this.closed?0:1))*t,a=Math.floor(o),c=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:c===0&&a===r-1&&(a=r-2,c=1);let h,d;this.closed||a>0?h=s[(a-1)%r]:(qs.subVectors(s[0],s[1]).add(s[0]),h=qs);let u=s[a%r],f=s[(a+1)%r];if(this.closed||a+2<r?d=s[(a+2)%r]:(qs.subVectors(s[r-1],s[r-2]).add(s[r-1]),d=qs),this.curveType==="centripetal"||this.curveType==="chordal"){let p=this.curveType==="chordal"?.5:.25,g=Math.pow(h.distanceToSquared(u),p),x=Math.pow(u.distanceToSquared(f),p),m=Math.pow(f.distanceToSquared(d),p);x<1e-4&&(x=1),g<1e-4&&(g=x),m<1e-4&&(m=x),Kr.initNonuniformCatmullRom(h.x,u.x,f.x,d.x,g,x,m),jr.initNonuniformCatmullRom(h.y,u.y,f.y,d.y,g,x,m),Qr.initNonuniformCatmullRom(h.z,u.z,f.z,d.z,g,x,m)}else this.curveType==="catmullrom"&&(Kr.initCatmullRom(h.x,u.x,f.x,d.x,this.tension),jr.initCatmullRom(h.y,u.y,f.y,d.y,this.tension),Qr.initCatmullRom(h.z,u.z,f.z,d.z,this.tension));return n.set(Kr.calc(c),jr.calc(c),Qr.calc(c)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){let s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(new L().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}};function Yc(i,t,e,n,s){let r=(n-t)*.5,o=(s-e)*.5,a=i*i,c=i*a;return(2*e-2*n+r+o)*c+(-3*e+3*n-2*r-o)*a+r*i+e}function Pm(i,t){let e=1-i;return e*e*t}function Lm(i,t){return 2*(1-i)*i*t}function Dm(i,t){return i*i*t}function fs(i,t,e,n){return Pm(i,t)+Lm(i,e)+Dm(i,n)}function Um(i,t){let e=1-i;return e*e*e*t}function Nm(i,t){let e=1-i;return 3*e*e*i*t}function Om(i,t){return 3*(1-i)*i*i*t}function Fm(i,t){return i*i*i*t}function ps(i,t,e,n,s){return Um(i,t)+Nm(i,e)+Om(i,n)+Fm(i,s)}var ca=class extends an{constructor(t=new kt,e=new kt,n=new kt,s=new kt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new kt){let n=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(ps(t,s.x,r.x,o.x,a.x),ps(t,s.y,r.y,o.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},la=class extends an{constructor(t=new L,e=new L,n=new L,s=new L){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new L){let n=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(ps(t,s.x,r.x,o.x,a.x),ps(t,s.y,r.y,o.y,a.y),ps(t,s.z,r.z,o.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},ha=class extends an{constructor(t=new kt,e=new kt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new kt){let n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new kt){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},ua=class extends an{constructor(t=new L,e=new L){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new L){let n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new L){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},da=class extends an{constructor(t=new kt,e=new kt,n=new kt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new kt){let n=e,s=this.v0,r=this.v1,o=this.v2;return n.set(fs(t,s.x,r.x,o.x),fs(t,s.y,r.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},Wn=class extends an{constructor(t=new L,e=new L,n=new L){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new L){let n=e,s=this.v0,r=this.v1,o=this.v2;return n.set(fs(t,s.x,r.x,o.x),fs(t,s.y,r.y,o.y),fs(t,s.z,r.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},fa=class extends an{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new kt){let n=e,s=this.points,r=(s.length-1)*t,o=Math.floor(r),a=r-o,c=s[o===0?o:o-1],h=s[o],d=s[o>s.length-2?s.length-1:o+1],u=s[o>s.length-3?s.length-1:o+2];return n.set(Yc(a,c.x,h.x,d.x,u.x),Yc(a,c.y,h.y,d.y,u.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(s.clone())}return this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){let s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(new kt().fromArray(s))}return this}},Bm=Object.freeze({__proto__:null,ArcCurve:oa,CatmullRomCurve3:aa,CubicBezierCurve:ca,CubicBezierCurve3:la,EllipseCurve:dr,LineCurve:ha,LineCurve3:ua,QuadraticBezierCurve:da,QuadraticBezierCurve3:Wn,SplineCurve:fa});var li=class i extends He{constructor(t=1,e=1,n=1,s=32,r=1,o=!1,a=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:c};let h=this;s=Math.floor(s),r=Math.floor(r);let d=[],u=[],f=[],p=[],g=0,x=[],m=n/2,l=0;E(),o===!1&&(t>0&&y(!0),e>0&&y(!1)),this.setIndex(d),this.setAttribute("position",new Ie(u,3)),this.setAttribute("normal",new Ie(f,3)),this.setAttribute("uv",new Ie(p,2));function E(){let v=new L,D=new L,I=0,P=(e-t)/n;for(let N=0;N<=r;N++){let w=[],b=N/r,U=b*(e-t)+t;for(let V=0;V<=s;V++){let H=V/s,W=H*c+a,$=Math.sin(W),G=Math.cos(W);D.x=U*$,D.y=-b*n+m,D.z=U*G,u.push(D.x,D.y,D.z),v.set($,P,G).normalize(),f.push(v.x,v.y,v.z),p.push(H,1-b),w.push(g++)}x.push(w)}for(let N=0;N<s;N++)for(let w=0;w<r;w++){let b=x[w][N],U=x[w+1][N],V=x[w+1][N+1],H=x[w][N+1];(t>0||w!==0)&&(d.push(b,U,H),I+=3),(e>0||w!==r-1)&&(d.push(U,V,H),I+=3)}h.addGroup(l,I,0),l+=I}function y(v){let D=g,I=new kt,P=new L,N=0,w=v===!0?t:e,b=v===!0?1:-1;for(let V=1;V<=s;V++)u.push(0,m*b,0),f.push(0,b,0),p.push(.5,.5),g++;let U=g;for(let V=0;V<=s;V++){let W=V/s*c+a,$=Math.cos(W),G=Math.sin(W);P.x=w*G,P.y=m*b,P.z=w*$,u.push(P.x,P.y,P.z),f.push(0,b,0),I.x=$*.5+.5,I.y=G*.5*b+.5,p.push(I.x,I.y),g++}for(let V=0;V<s;V++){let H=D+V,W=U+V;v===!0?d.push(W,W+1,H):d.push(W+1,W,H),N+=3}h.addGroup(l,N,v===!0?1:2),l+=N}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Hi=class i extends li{constructor(t=1,e=1,n=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,t,e,n,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(t){return new i(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}};var Vi=class i extends He{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));let c=Math.min(o+a,Math.PI),h=0,d=[],u=new L,f=new L,p=[],g=[],x=[],m=[];for(let l=0;l<=n;l++){let E=[],y=l/n,v=0;l===0&&o===0?v=.5/e:l===n&&c===Math.PI&&(v=-.5/e);for(let D=0;D<=e;D++){let I=D/e;u.x=-t*Math.cos(s+I*r)*Math.sin(o+y*a),u.y=t*Math.cos(o+y*a),u.z=t*Math.sin(s+I*r)*Math.sin(o+y*a),g.push(u.x,u.y,u.z),f.copy(u).normalize(),x.push(f.x,f.y,f.z),m.push(I+v,1-y),E.push(h++)}d.push(E)}for(let l=0;l<n;l++)for(let E=0;E<e;E++){let y=d[l][E+1],v=d[l][E],D=d[l+1][E],I=d[l+1][E+1];(l!==0||o>0)&&p.push(y,v,I),(l!==n-1||c<Math.PI)&&p.push(v,D,I)}this.setIndex(p),this.setAttribute("position",new Ie(g,3)),this.setAttribute("normal",new Ie(x,3)),this.setAttribute("uv",new Ie(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};var Gi=class i extends He{constructor(t=new Wn(new L(-1,-1,0),new L(-1,1,0),new L(1,1,0)),e=64,n=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:e,radius:n,radialSegments:s,closed:r};let o=t.computeFrenetFrames(e,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;let a=new L,c=new L,h=new kt,d=new L,u=[],f=[],p=[],g=[];x(),this.setIndex(g),this.setAttribute("position",new Ie(u,3)),this.setAttribute("normal",new Ie(f,3)),this.setAttribute("uv",new Ie(p,2));function x(){for(let y=0;y<e;y++)m(y);m(r===!1?e:0),E(),l()}function m(y){d=t.getPointAt(y/e,d);let v=o.normals[y],D=o.binormals[y];for(let I=0;I<=s;I++){let P=I/s*Math.PI*2,N=Math.sin(P),w=-Math.cos(P);c.x=w*v.x+N*D.x,c.y=w*v.y+N*D.y,c.z=w*v.z+N*D.z,c.normalize(),f.push(c.x,c.y,c.z),a.x=d.x+n*c.x,a.y=d.y+n*c.y,a.z=d.z+n*c.z,u.push(a.x,a.y,a.z)}}function l(){for(let y=1;y<=e;y++)for(let v=1;v<=s;v++){let D=(s+1)*(y-1)+(v-1),I=(s+1)*y+(v-1),P=(s+1)*y+v,N=(s+1)*(y-1)+v;g.push(D,I,N),g.push(I,P,N)}}function E(){for(let y=0;y<=e;y++)for(let v=0;v<=s;v++)h.x=y/e,h.y=v/s,p.push(h.x,h.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new i(new Bm[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}};var Wi=class extends ai{static get type(){return"MeshStandardMaterial"}constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new ie(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ie(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=hl,this.normalScale=new kt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new fn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}},mn=class extends Wi{static get type(){return"MeshPhysicalMaterial"}constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new kt(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Ce(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new ie(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new ie(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new ie(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}};function Ys(i,t,e){return!i||!e&&i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}function zm(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var Xi=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let o;e:{i:if(!(t<s)){for(let a=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=s,s=e[++n],t<s)break t}o=e.length;break e}if(!(t>=r)){let a=e[1];t<a&&(n=2,r=a);for(let c=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===c)break;if(s=r,r=e[--n-1],t>=r)break t}o=n,n=0;break e}break n}for(;n<o;){let a=n+o>>>1;t<e[a]?o=a:n=a+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let o=0;o!==s;++o)e[o]=n[r+o];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},pa=class extends Xi{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Ja,endingEnd:Ja}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,o=t+1,a=s[r],c=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case Ka:r=t,a=2*e-n;break;case ja:r=s.length-2,a=e+s[r]-s[r+1];break;default:r=t,a=n}if(c===void 0)switch(this.getSettings_().endingEnd){case Ka:o=t,c=2*n-e;break;case ja:o=1,c=n+s[1]-s[0];break;default:o=t-1,c=e}let h=(n-e)*.5,d=this.valueSize;this._weightPrev=h/(e-a),this._weightNext=h/(c-n),this._offsetPrev=r*d,this._offsetNext=o*d}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=t*a,h=c-a,d=this._offsetPrev,u=this._offsetNext,f=this._weightPrev,p=this._weightNext,g=(n-e)/(s-e),x=g*g,m=x*g,l=-f*m+2*f*x-f*g,E=(1+f)*m+(-1.5-2*f)*x+(-.5+f)*g+1,y=(-1-p)*m+(1.5+p)*x+.5*g,v=p*m-p*x;for(let D=0;D!==a;++D)r[D]=l*o[d+D]+E*o[h+D]+y*o[c+D]+v*o[u+D];return r}},ma=class extends Xi{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=t*a,h=c-a,d=(n-e)/(s-e),u=1-d;for(let f=0;f!==a;++f)r[f]=o[h+f]*u+o[c+f]*d;return r}},ga=class extends Xi{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},cn=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Ys(e,this.TimeBufferType),this.values=Ys(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:Ys(t.times,Array),values:Ys(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s)}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new ga(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new ma(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new pa(this.times,this.values,this.getValueSize(),t)}setInterpolation(t){let e;switch(t){case Qs:e=this.InterpolantFactoryMethodDiscrete;break;case Vo:e=this.InterpolantFactoryMethodLinear;break;case Er:e=this.InterpolantFactoryMethodSmooth;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Qs;case this.InterpolantFactoryMethodLinear:return Vo;case this.InterpolantFactoryMethodSmooth:return Er}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t}return this}trim(t,e){let n=this.times,s=n.length,r=0,o=s-1;for(;r!==s&&n[r]<t;)++r;for(;o!==-1&&n[o]>e;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),t=!1);let o=null;for(let a=0;a!==r;a++){let c=n[a];if(typeof c=="number"&&isNaN(c)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,c),t=!1;break}if(o!==null&&o>c){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,c,o),t=!1;break}o=c}if(s!==void 0&&zm(s))for(let a=0,c=s.length;a!==c;++a){let h=s[a];if(isNaN(h)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,h),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Er,r=t.length-1,o=1;for(let a=1;a<r;++a){let c=!1,h=t[a],d=t[a+1];if(h!==d&&(a!==1||h!==t[0]))if(s)c=!0;else{let u=a*n,f=u-n,p=u+n;for(let g=0;g!==n;++g){let x=e[u+g];if(x!==e[f+g]||x!==e[p+g]){c=!0;break}}}if(c){if(a!==o){t[o]=t[a];let u=a*n,f=o*n;for(let p=0;p!==n;++p)e[f+p]=e[u+p]}++o}}if(r>0){t[o]=t[r];for(let a=r*n,c=o*n,h=0;h!==n;++h)e[c+h]=e[a+h];++o}return o!==t.length?(this.times=t.slice(0,o),this.values=e.slice(0,o*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,s}};cn.prototype.TimeBufferType=Float32Array;cn.prototype.ValueBufferType=Float32Array;cn.prototype.DefaultInterpolation=Vo;var hi=class extends cn{constructor(t,e,n){super(t,e,n)}};hi.prototype.ValueTypeName="bool";hi.prototype.ValueBufferType=Array;hi.prototype.DefaultInterpolation=Qs;hi.prototype.InterpolantFactoryMethodLinear=void 0;hi.prototype.InterpolantFactoryMethodSmooth=void 0;var xa=class extends cn{};xa.prototype.ValueTypeName="color";var _a=class extends cn{};_a.prototype.ValueTypeName="number";var ya=class extends Xi{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=(n-e)/(s-e),h=t*a;for(let d=h+a;h!==d;h+=4)Hn.slerpFlat(r,0,o,h-a,o,h,c);return r}},fr=class extends cn{InterpolantFactoryMethodLinear(t){return new ya(this.times,this.values,this.getValueSize(),t)}};fr.prototype.ValueTypeName="quaternion";fr.prototype.InterpolantFactoryMethodSmooth=void 0;var ui=class extends cn{constructor(t,e,n){super(t,e,n)}};ui.prototype.ValueTypeName="string";ui.prototype.ValueBufferType=Array;ui.prototype.DefaultInterpolation=Qs;ui.prototype.InterpolantFactoryMethodLinear=void 0;ui.prototype.InterpolantFactoryMethodSmooth=void 0;var va=class extends cn{};va.prototype.ValueTypeName="vector";var Ma=class{constructor(t,e,n){let s=this,r=!1,o=0,a=0,c,h=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this.itemStart=function(d){a++,r===!1&&s.onStart!==void 0&&s.onStart(d,o,a),r=!0},this.itemEnd=function(d){o++,s.onProgress!==void 0&&s.onProgress(d,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(d){s.onError!==void 0&&s.onError(d)},this.resolveURL=function(d){return c?c(d):d},this.setURLModifier=function(d){return c=d,this},this.addHandler=function(d,u){return h.push(d,u),this},this.removeHandler=function(d){let u=h.indexOf(d);return u!==-1&&h.splice(u,2),this},this.getHandler=function(d){for(let u=0,f=h.length;u<f;u+=2){let p=h[u],g=h[u+1];if(p.global&&(p.lastIndex=0),p.test(d))return g}return null}}},km=new Ma,ba=class{constructor(t){this.manager=t!==void 0?t:km,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}};ba.DEFAULT_MATERIAL_NAME="__DEFAULT";var ys=class extends Be{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new ie(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}},qi=class extends ys{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Be.DEFAULT_UP),this.updateMatrix(),this.groundColor=new ie(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}},to=new _e,$c=new L,Zc=new L,pr=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new kt(512,512),this.map=null,this.mapPass=null,this.matrix=new _e,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new _s,this._frameExtents=new kt(1,1),this._viewportCount=1,this._viewports=[new pe(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera,n=this.matrix;$c.setFromMatrixPosition(t.matrixWorld),e.position.copy($c),Zc.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Zc),e.updateMatrixWorld(),to.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(to),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(to)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}};var Jc=new _e,as=new L,eo=new L,Sa=class extends pr{constructor(){super(new Re(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new kt(4,2),this._viewportCount=6,this._viewports=[new pe(2,1,1,1),new pe(0,1,1,1),new pe(3,1,1,1),new pe(1,1,1,1),new pe(3,0,1,1),new pe(1,0,1,1)],this._cubeDirections=[new L(1,0,0),new L(-1,0,0),new L(0,0,1),new L(0,0,-1),new L(0,1,0),new L(0,-1,0)],this._cubeUps=[new L(0,1,0),new L(0,1,0),new L(0,1,0),new L(0,1,0),new L(0,0,1),new L(0,0,-1)]}updateMatrices(t,e=0){let n=this.camera,s=this.matrix,r=t.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),as.setFromMatrixPosition(t.matrixWorld),n.position.copy(as),eo.copy(n.position),eo.add(this._cubeDirections[e]),n.up.copy(this._cubeUps[e]),n.lookAt(eo),n.updateMatrixWorld(),s.makeTranslation(-as.x,-as.y,-as.z),Jc.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Jc)}},mr=class extends ys{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new Sa}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}},Ea=class extends pr{constructor(){super(new hr(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Xn=class extends ys{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Be.DEFAULT_UP),this.updateMatrix(),this.target=new Be,this.shadow=new Ea}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}};var Oa="\\[\\]\\.:\\/",Hm=new RegExp("["+Oa+"]","g"),Fa="[^"+Oa+"]",Vm="[^"+Oa.replace("\\.","")+"]",Gm=/((?:WC+[\/:])*)/.source.replace("WC",Fa),Wm=/(WCOD+)?/.source.replace("WCOD",Vm),Xm=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Fa),qm=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Fa),Ym=new RegExp("^"+Gm+Wm+Xm+qm+"$"),$m=["material","materials","bones","map"],wa=class{constructor(t,e,n){let s=n||xe.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},xe=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(Hm,"")}static parseTrackName(t){let e=Ym.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);$m.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===e||a.uuid===e)return a;let c=n(a.children);if(c)return c}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let h=e.objectIndex;switch(n){case"materials":if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let d=0;d<t.length;d++)if(t[d].name===h){h=d;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(h!==void 0){if(t[h]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[h]}}let o=t[s];if(o===void 0){let h=e.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+h+"."+s+" but it wasn't found.",t);return}let a=this.Versioning.None;this.targetObject=t,t.needsUpdate!==void 0?a=this.Versioning.NeedsUpdate:t.matrixWorldNeedsUpdate!==void 0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};xe.Composite=wa;xe.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};xe.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};xe.prototype.GetterByBindingType=[xe.prototype._getValue_direct,xe.prototype._getValue_array,xe.prototype._getValue_arrayElement,xe.prototype._getValue_toArray];xe.prototype.SetterByBindingTypeAndVersioning=[[xe.prototype._setValue_direct,xe.prototype._setValue_direct_setNeedsUpdate,xe.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[xe.prototype._setValue_array,xe.prototype._setValue_array_setNeedsUpdate,xe.prototype._setValue_array_setMatrixWorldNeedsUpdate],[xe.prototype._setValue_arrayElement,xe.prototype._setValue_arrayElement_setNeedsUpdate,xe.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[xe.prototype._setValue_fromArray,xe.prototype._setValue_fromArray_setNeedsUpdate,xe.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var ag=new Float32Array(1);typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ta}}));typeof window!="undefined"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ta);var Ki=class extends Gn{constructor(){super();let t=new ci;t.deleteAttribute("uv");let e=new Wi({side:Ue}),n=new Wi,s=new mr(16777215,900,28,2);s.position.set(.418,16.199,.3),this.add(s);let r=new Yt(t,e);r.position.set(-.757,13.219,.717),r.scale.set(31.713,28.305,28.591),this.add(r);let o=new Yt(t,n);o.position.set(-10.906,2.009,1.846),o.rotation.set(0,-.195,0),o.scale.set(2.328,7.905,4.651),this.add(o);let a=new Yt(t,n);a.position.set(-5.607,-.754,-.758),a.rotation.set(0,.994,0),a.scale.set(1.97,1.534,3.955),this.add(a);let c=new Yt(t,n);c.position.set(6.167,.857,7.803),c.rotation.set(0,.561,0),c.scale.set(3.927,6.285,3.687),this.add(c);let h=new Yt(t,n);h.position.set(-2.017,.018,6.124),h.rotation.set(0,.333,0),h.scale.set(2.002,4.566,2.064),this.add(h);let d=new Yt(t,n);d.position.set(2.291,-.756,-2.621),d.rotation.set(0,-.286,0),d.scale.set(1.546,1.552,1.496),this.add(d);let u=new Yt(t,n);u.position.set(-2.193,-.369,-5.547),u.rotation.set(0,.516,0),u.scale.set(3.875,3.487,2.986),this.add(u);let f=new Yt(t,Ji(50));f.position.set(-16.116,14.37,8.208),f.scale.set(.1,2.428,2.739),this.add(f);let p=new Yt(t,Ji(50));p.position.set(-16.109,18.021,-8.207),p.scale.set(.1,2.425,2.751),this.add(p);let g=new Yt(t,Ji(17));g.position.set(14.904,12.198,-1.832),g.scale.set(.15,4.265,6.331),this.add(g);let x=new Yt(t,Ji(43));x.position.set(-.462,8.89,14.52),x.scale.set(4.38,5.441,.088),this.add(x);let m=new Yt(t,Ji(20));m.position.set(3.235,11.486,-12.541),m.scale.set(2.5,2,.1),this.add(m);let l=new Yt(t,Ji(100));l.position.set(0,20,0),l.scale.set(1,.1,1),this.add(l)}dispose(){let t=new Set;this.traverse(e=>{e.isMesh&&(t.add(e.geometry),t.add(e.material))});for(let e of t)e.dispose()}};function Ji(i){let t=new ke;return t.color.setScalar(i),t}var Ba={Br:{name:"bromine",xo:"bromo",ion:"bromide"},Cl:{name:"chlorine",xo:"chloro",ion:"chloride"},I:{name:"iodine",xo:"iodo",ion:"iodide"}},Zm=`<svg class="mbx-fig" viewBox="0 0 960 300" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <defs>
    <marker id="mbx-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#c0392b"/></marker>
    <marker id="mbx-ra" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#222"/></marker>
    <pattern id="mbx-ruled" width="960" height="28" patternUnits="userSpaceOnUse"><line x1="0" y1="27.5" x2="960" y2="27.5" stroke="#dfe6f0" stroke-width="1"/></pattern>
    <mask id="mbx-ndim"><rect width="960" height="300" fill="white"/><g id="mbx-nholes" fill="black"></g></mask>
    <filter id="mbx-nfeather"><feGaussianBlur stdDeviation="7"/></filter>
  </defs>
  <rect width="960" height="300" fill="#fbfaf6"/>
  <rect width="960" height="300" fill="url(#mbx-ruled)"/>
  <line x1="44" y1="0" x2="44" y2="300" stroke="#f3b6b6" stroke-width="1.2"/>
  <g fill="#1d1d22" font-size="22" stroke-linecap="round">
    <!-- reactants: hydroxide + (S)-2-{xo}butane -->
    <text x="58" y="158">HO</text><text x="88" y="146" font-size="16">\u2296</text>
    <circle cx="70" cy="132" r="2.4"/><circle cx="79" cy="132" r="2.4"/>
    <circle cx="70" cy="170" r="2.4"/><circle cx="79" cy="170" r="2.4"/>
    <path d="M86 128 C 120 70, 185 80, 206 136" fill="none" stroke="#c0392b" stroke-width="2.4" marker-end="url(#mbx-ah)"/>
    <text x="211" y="158">C</text>
    <text x="234" y="140" font-size="15" fill="#c0392b">\u03B4+</text>
    <line x1="232" y1="151" x2="300" y2="151" stroke="#1d1d22" stroke-width="2.6"/>
    <text x="304" y="158">{X}</text>
    <text x="306" y="186" font-size="15" fill="#c0392b">\u03B4\u2212</text>
    <path d="M266 146 C 270 110, 316 104, 326 132" fill="none" stroke="#c0392b" stroke-width="2.4" marker-end="url(#mbx-ah)"/>
    <line x1="215" y1="138" x2="204" y2="96" stroke="#1d1d22" stroke-width="2.6"/>
    <text x="180" y="90">H\u2083C</text>
    <path d="M214 160 L 168 182 L 172 190 z" fill="#1d1d22"/>
    <text x="150" y="200">H</text>
    <g stroke="#1d1d22" stroke-width="2.2"><line x1="214" y1="165" x2="210" y2="170"/><line x1="208" y1="176" x2="204" y2="182"/><line x1="203" y1="188" x2="198" y2="194"/><line x1="196" y1="200" x2="192" y2="206"/></g>
    <text x="176" y="230">C\u2082H\u2085</text>
    <text x="70" y="270" font-size="14" fill="#555">(S)-2-{xo}butane</text>
    <!-- arrow -->
    <line x1="352" y1="151" x2="402" y2="151" stroke="#222" stroke-width="2.2" marker-end="url(#mbx-ra)"/>
    <!-- transition state -->
    <path d="M420 70 L 410 70 L 410 238 L 420 238" fill="none" stroke="#1d1d22" stroke-width="2.2"/>
    <text x="428" y="158">HO</text><text x="430" y="128" font-size="15" fill="#c0392b">\u03B4\u2212</text>
    <g stroke="#1d1d22" stroke-width="2.4" stroke-dasharray="3 6"><line x1="464" y1="151" x2="510" y2="151"/><line x1="536" y1="151" x2="584" y2="151"/></g>
    <text x="513" y="158">C</text>
    <text x="588" y="158">{X}</text><text x="594" y="128" font-size="15" fill="#c0392b">\u03B4\u2212</text>
    <line x1="521" y1="136" x2="521" y2="96" stroke="#1d1d22" stroke-width="2.6"/>
    <text x="500" y="90">CH\u2083</text>
    <path d="M517 162 L 496 198 L 504 201 z" fill="#1d1d22"/><text x="484" y="218">H</text>
    <g stroke="#1d1d22" stroke-width="2.2"><line x1="526" y1="164" x2="531" y2="169"/><line x1="534" y1="175" x2="539" y2="181"/><line x1="542" y1="187" x2="547" y2="193"/></g>
    <text x="536" y="214">C\u2082H\u2085</text>
    <path d="M622 70 L 632 70 L 632 238 L 622 238" fill="none" stroke="#1d1d22" stroke-width="2.2"/>
    <text x="638" y="84" font-size="24">\u2021</text><text x="652" y="76" font-size="16">\u2296</text>
    <text x="456" y="270" font-size="14" fill="#555">transition state</text>
    <!-- arrow -->
    <line x1="664" y1="151" x2="712" y2="151" stroke="#222" stroke-width="2.2" marker-end="url(#mbx-ra)"/>
    <!-- product: (R)-butan-2-ol + bromide -->
    <text x="724" y="158">HO</text>
    <line x1="757" y1="151" x2="800" y2="151" stroke="#1d1d22" stroke-width="2.6"/>
    <text x="803" y="158">C</text>
    <line x1="818" y1="138" x2="829" y2="96" stroke="#1d1d22" stroke-width="2.6"/>
    <text x="816" y="90">CH\u2083</text>
    <path d="M820 160 L 862 182 L 858 190 z" fill="#1d1d22"/><text x="864" y="200">H</text>
    <g stroke="#1d1d22" stroke-width="2.2"><line x1="818" y1="165" x2="822" y2="170"/><line x1="825" y1="176" x2="829" y2="182"/><line x1="831" y1="188" x2="835" y2="194"/><line x1="837" y1="200" x2="841" y2="206"/></g>
    <text x="822" y="230">C\u2082H\u2085</text>
    <text x="882" y="158" font-size="20">+ {X}</text><text x="926" y="146" font-size="15">\u2296</text>
    <text x="740" y="270" font-size="14" fill="#555">(R)-butan-2-ol</text>
    <!-- rate law -->
    <text x="356" y="292" font-size="16" fill="#1d4f91" font-style="italic">rate = k[R{X}][OH\u207B]  (2nd order)</text>
  </g>
  <!-- the figure's own numbered key, as in a textbook figure -->
  <g font-size="13" font-weight="700" text-anchor="middle">
    <g transform="translate(60,112)"><circle r="11" fill="#1d1d22"/><text y="4.5" fill="#fff">1</text></g>
    <g transform="translate(148,72)"><circle r="11" fill="#1d1d22"/><text y="4.5" fill="#fff">2</text></g>
    <g transform="translate(244,182)"><circle r="11" fill="#1d1d22"/><text y="4.5" fill="#fff">3</text></g>
    <g transform="translate(296,100)"><circle r="11" fill="#1d1d22"/><text y="4.5" fill="#fff">4</text></g>
    <g transform="translate(350,176)"><circle r="11" fill="#1d1d22"/><text y="4.5" fill="#fff">5</text></g>
    <g transform="translate(660,232)"><circle r="11" fill="#1d1d22"/><text y="4.5" fill="#fff">6</text></g>
    <g transform="translate(912,232)"><circle r="11" fill="#1d1d22"/><text y="4.5" fill="#fff">7</text></g>
    <g transform="translate(340,287)"><circle r="11" fill="#1d1d22"/><text y="4.5" fill="#fff">8</text></g>
  </g>
  <rect id="mbx-ndimrect" width="960" height="300" fill="#0b0c12" opacity="0" mask="url(#mbx-ndim)" style="transition:opacity .6s"/>
  <g id="mbx-nrings" fill="none" stroke="#ffb000" stroke-width="3" stroke-dasharray="8 5"></g>
</svg>
`,Ml={id:"sn2",title:"The SN2 reaction",subject:"Organic chemistry \xB7 Nucleophilic substitution",halo:Ba,figure:i=>{let t=Ba[i]||Ba.Br;return Zm.split("{X}").join(i).split("{xo}").join(t.xo)},regions:{1:[76,150,34,34],2:[146,98,64,36],3:[224,150,28,26],4:[296,122,42,28],5:[318,152,30,24],6:[521,154,122,92],7:[826,160,112,82],8:[470,287,128,15]},key:i=>["Nucleophile (HO\u207B)","Curly arrow: lone pair attacks C","\u03B4+ carbon (electrophile)",`Curly arrow: C\u2013${i} bond breaks`,`Leaving group (${i}\u207B)`,"Transition state \u2021","Product: inverted (R)",`Rate = k[R${i}][OH\u207B]`],lines:["SN2 = Substitution, Nucleophilic, bimolecular. One step: the new bond forms as the old one breaks.","C\u2013Br is polar: carbon \u03B4+ (the electrophile), bromine \u03B4\u2212.","The nucleophile HO\u207B attacks the \u03B4+ carbon using a lone pair.","Attack is from the back: 180\xB0 from the leaving group (backside attack).","Transition state [HO\xB7\xB7\xB7C\xB7\xB7\xB7Br]\u207B: carbon partly bonded to both, the other 3 groups flat.","The 3 groups flip like an umbrella: inversion of configuration (Walden inversion).","(S)-2-bromobutane \u2192 (R)-butan-2-ol.","Rate = k[RBr][OH\u207B]: second order, both species in the one step.","Methyl > 1\xB0 > 2\xB0. 3\xB0 haloalkanes don't do SN2 (steric hindrance) \u2192 SN1."],steps:[{id:"overview",title:"The whole reaction",line:0,note:[],overview:!0,arrows:[1,2],play:{from:0,to:1,dur:7,loop:"repeat",hold:1.4},shot:{t:[-.6,.2,0],d:11.5,yaw:18,pitch:14,orbit:3},say:"This is the SN2 mechanism, built as real molecules. On the left, hydroxide. In the middle, 2-bromobutane. Watch one whole reaction: hydroxide comes in from the back, bromide leaves from the front, and the molecule turns inside out. Then we'll slow it down, one number at a time."},{id:"polar",title:"3 & 5 \xB7 A polar C\u2013X bond",line:1,note:[3,5],focus:["C2","Br"],charges:!0,play:{from:0,to:0},shot:{t:[.9,0,0],d:7.5,yaw:25,pitch:12,orbit:5},say:"Start with the substrate, (S)-2-bromobutane. Number three on the figure is the carbon holding the bromine. Bromine is more electronegative, so it pulls the shared electrons towards itself. That leaves carbon slightly positive, delta plus, and bromine slightly negative. The delta-plus carbon is the electrophile: the target."},{id:"nucleophile",title:"1 \xB7 The nucleophile",line:2,note:[1],focus:["O"],lp:!0,play:{from:.12,to:.12},shot:{t:[-3.6,.2,0],d:6,yaw:-30,pitch:14,orbit:6},say:"Number one is hydroxide, the nucleophile. Oxygen carries three lone pairs, shown in blue, and a full negative charge. That's electron density looking for a positive centre. Nucleophile literally means nucleus-loving."},{id:"attack",title:"2 \xB7 Backside attack",line:3,note:[2,3],focus:["O","C2"],lp:!0,sigma:!0,arrows:[1],play:{from:.05,to:.4,dur:6,delay:1},shot:{t:[-1.3,.4,0],d:10,yaw:-32,pitch:24},say:"Curly arrow two: a lone pair on oxygen attacks the carbon. But from where? Always from the back, exactly opposite the bromine. Two reasons. The empty orbital it has to fill, the carbon\u2013bromine sigma-star, has its big lobe right here, behind the carbon. And coming from the back keeps the negative nucleophile away from the electron-rich bromine."},{id:"ts",title:"6 \xB7 The transition state",line:4,note:[6],focus:["O","C2","Br"],play:{from:.5,to:.5,wobble:.025},shot:{t:[.1,.2,0],d:9,yaw:8,pitch:10,orbit:4},say:"Number six, the transition state, the top of the energy hill. The oxygen\u2013carbon bond is half made and the carbon\u2013bromine bond is half broken, shown as dashed gold lines. Carbon briefly has five groups around it, and the other three lie flat in one plane. The negative charge is shared between oxygen and bromine. It lasts less than a picosecond: a moment, not an intermediate you could ever isolate."},{id:"leave",title:"4 & 5 \xB7 The leaving group goes",line:0,note:[4,5],focus:["Br"],arrows:[2],play:{from:.4,to:.9,dur:5,delay:.8},shot:{t:[1.6,.2,0],d:10,yaw:30,pitch:14},say:"Curly arrow four: the electrons of the carbon\u2013bromine bond move onto bromine, and bromide, number five, leaves with them. The new bond forming and the old bond breaking happen in a single step. That's what concerted means."},{id:"umbrella",title:"The umbrella flips",line:5,note:[6,7],focus:["Me","Et","H2"],play:{from:.2,to:.85,dur:4.5,loop:"repeat",hold:1.2},shot:{t:[0,.3,0],d:8.5,yaw:0,pitch:6},say:"Now watch the other three groups: methyl, ethyl and hydrogen. As hydroxide pushes in and bromide pulls out, they flip to the other side, like an umbrella turning inside out in the wind. This is Walden inversion. Every SN2 at a stereocentre inverts it."},{id:"cip",title:"7 \xB7 S becomes R",line:6,note:[7],cip:!0,play:{from:0,to:1,dur:4,delay:3.5},shot:{t:[-.3,.2,0],d:11,yaw:-10,pitch:30},say:"Check the priorities, shown in gold. In the starting material: bromine one, ethyl two, methyl three, hydrogen four. With hydrogen pointing away, one, two, three runs anticlockwise, so it's S. In the product, hydroxyl takes priority one, and the groups have flipped, so one, two, three now runs clockwise: R. Careful in exams: the letter only swaps because the nucleophile takes the same priority rank as the leaving group."},{id:"rate",title:"8 \xB7 Why it's second order",line:7,note:[8],arrows:[1,2],play:{from:0,to:1,dur:6,loop:"repeat",hold:1},shot:{t:[-.6,.2,0],d:12,yaw:-12,pitch:12,orbit:-3},say:"There is only one step, and both the haloalkane and the hydroxide are in it. So the rate depends on both concentrations: rate equals k, times haloalkane, times hydroxide. Double either one and the rate doubles. That's the two in SN2: bimolecular. Watch the energy profile: one hill, no valley in the middle."},{id:"tertiary",title:"Why tertiary can't",line:8,note:[],mode:"tert",vdw:!0,play:{from:0,to:1,dur:4.5,loop:"repeat",hold:.4},shot:{t:[-1.6,.2,0],d:12,yaw:-18,pitch:12},say:"Now swap in a tertiary haloalkane, with three methyl groups on the carbon. The clouds show how much room each hydrogen really takes up. Watch hydroxide try to reach the back of the carbon: there's no space, so it bounces off. That's steric hindrance. SN2 is fastest for methyl, then primary, then secondary, and essentially never happens at a tertiary carbon. Those react by SN1 instead."},{id:"quiz",title:"Check yourself",line:null,note:[7],quiz:!0,play:{from:0,to:1,dur:6,loop:"repeat",hold:1},shot:{t:[-.6,.2,0],d:12,yaw:12,pitch:14,orbit:3},say:"Quick check. If you started with (R)-2-bromobutane instead, what would SN2 with hydroxide give you? Decide, then tap to reveal.",answer:"(S)-butan-2-ol. SN2 always inverts the stereocentre, and because OH takes the same priority rank the leaving group had, R becomes S."}]};var yr=`
.mbx{--mbx-gold:#ffc040;color:var(--text,#f2f3f8);font-size:15px;line-height:1.5}
.mbx *{box-sizing:border-box}
.mbx-stage{position:relative;width:100%;aspect-ratio:16/10;border-radius:16px;overflow:hidden;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;
  background:radial-gradient(110% 90% at 50% 40%,#1d2133 0%,#0d0e17 60%,#06070b 100%);box-shadow:0 0 0 1px #ffffff14,0 20px 60px -30px #000}
.mbx-stage:active{cursor:grabbing}
@media (max-width:640px){.mbx-stage{aspect-ratio:4/5}}
.mbx-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.mbx-labels{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.mbx-labels>div{position:absolute;left:0;top:0;transition:opacity .35s;will-change:transform}
.mbx-q{font:700 15px/1 ui-sans-serif,system-ui;color:#ffd7a0;text-shadow:0 0 8px #000,0 0 3px #000;translate:-50% -50%}
.mbx-ts{font-size:34px;font-weight:300;color:var(--mbx-gold);text-shadow:0 0 18px #ffc04099;translate:-50% -60%}
.mbx-block{font-size:13px;font-weight:700;color:#fff;background:#c0392bdd;border-radius:999px;padding:5px 11px;white-space:nowrap;translate:-50% 0}
.mbx-cip{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--mbx-gold);color:#201400;font-size:12px;font-weight:800;box-shadow:0 0 14px #ffc040aa;translate:-50% -50%}
.mbx-tag{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;padding:5px 12px 5px 6px;border-radius:999px;background:#0b0c12e6;border:1px solid var(--mbx-gold);color:#ffe2a0;font-size:13px;font-weight:650;box-shadow:0 8px 24px -6px #000;translate:-50% 0}
.mbx-tag b{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--mbx-gold);color:#201400;font-size:11px}
.mbx-hud{position:absolute;left:10px;top:10px;right:10px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;pointer-events:none;color:#f2f3f8}
.mbx-chip{background:#0b0c12c4;border:1px solid #ffffff1c;border-radius:12px;padding:7px 11px;backdrop-filter:blur(8px)}
.mbx-chip small{display:block;color:#9aa0b4;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase}.mbx-chip b{font-size:15px}
.mbx-energy{width:210px;padding:5px 8px 2px}
.mbx-energy svg{display:block;width:100%;height:auto}
@media (max-width:640px){.mbx-energy{width:140px}.mbx-chip b{font-size:13.5px}}
.mbx-meters{position:absolute;left:10px;bottom:10px;display:flex;gap:8px;pointer-events:none;color:#9aa0b4;font-size:12px}
.mbx-bar{display:flex;align-items:center;gap:8px}.mbx-bar span{width:40px}.mbx-bar i{width:70px;height:6px;border-radius:9px;background:#ffffff14;overflow:hidden;display:block}.mbx-bar i em{display:block;height:100%;width:0;background:var(--mbx-gold);border-radius:9px}
.mbx-cfg{font-size:20px;font-weight:800;color:#8fb2ff}.mbx-cfg.r{color:#ff9aa5}
.mbx-badge{position:absolute;right:10px;bottom:10px;font-size:11.5px;color:#cfd3e0;background:#0b0c12b0;border:1px solid #ffffff1c;border-radius:999px;padding:4px 10px;pointer-events:none}
.mbx-badge.ok{color:#04150d;background:#2fd18d;border-color:#2fd18d}
.mbx-card{margin-top:10px;background:var(--panel,#10121a);border:1px solid var(--line,#232739);border-radius:14px;padding:10px 12px}
.mbx-card h4{margin:0 0 8px;font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim,#9aa0b4)}
.mbx-fig{display:block;width:100%;height:auto;border-radius:10px}
.mbx-cap{font-size:17px;line-height:1.55;min-height:3.2em;color:var(--dim,#9aa0b4)}
.mbx-cap span{transition:color .3s}.mbx-cap span.on{color:var(--text,#f2f3f8)}
.mbx-ctl{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:10px}
.mbx-ctl button{font:inherit;font-size:13.5px;border:1px solid var(--line,#232739);background:var(--panel,#161927);color:var(--text,#f2f3f8);border-radius:10px;padding:8px 12px;cursor:pointer}
.mbx-ctl .mbx-play{background:var(--accent,#7c5cff);border-color:var(--accent,#7c5cff);color:#fff;font-weight:700}
.mbx-ctl .sp{flex:1}
.mbx-quiz{margin-top:8px}.mbx-quiz button{font:inherit;background:var(--mbx-gold);color:#201400;border:0;font-weight:700;border-radius:10px;padding:8px 13px;cursor:pointer}
.mbx-reveal{margin-top:8px;color:#e0a800;font-size:15.5px}
.mbx-chaps{display:flex;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px}
.mbx-chaps button{flex:none;font:inherit;font-size:12.5px;border:1px solid var(--line,#232739);background:transparent;color:var(--dim,#9aa0b4);border-radius:999px;padding:6px 11px;cursor:pointer;white-space:nowrap}
.mbx-chaps button.on{background:var(--accent,#7c5cff);border-color:var(--accent,#7c5cff);color:#fff}
.mbx-cols{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media (max-width:720px){.mbx-cols{grid-template-columns:1fr}}
.mbx-key,.mbx-lines{margin:0;padding:0;list-style:none;display:grid;gap:3px}
.mbx-key li{display:flex;gap:8px;align-items:center;font-size:13px;color:var(--dim,#9aa0b4);padding:3px 5px;border-radius:8px;cursor:pointer}
.mbx-key li b{width:20px;height:20px;flex:none;border-radius:50%;display:grid;place-items:center;font-size:10.5px;background:var(--line,#232739)}
.mbx-key li.on{background:#ffc04022;color:var(--text,#f2f3f8)}.mbx-key li.on b{background:var(--mbx-gold);color:#201400}
.mbx-lines li{font-size:13.5px;color:var(--dim,#9aa0b4);padding:3px 6px;border-radius:6px;transition:.3s}
.mbx-lines li.on{color:var(--text,#f2f3f8);background:#ffc0401c;box-shadow:inset 3px 0 0 var(--mbx-gold)}
.mbx-legend{display:flex;gap:12px;flex-wrap:wrap;font-size:11.5px;color:var(--dim,#9aa0b4);margin-top:8px}
.mbx-legend em{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:-1px}
`;var za={sn2:Ml},Ke=(i,t,e)=>Math.max(t,Math.min(e,i)),Ss=i=>(i=Ke(i,0,1),i*i*(3-2*i)),ye=(i,t,e)=>new L(i,t,e),ji=i=>String(i==null?"":i).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]);function bs(i,t){if(i<=t[0][0])return t[0][1];for(let e=0;e<t.length-1;e++){let[n,s]=t[e],[r,o]=t[e+1];if(i<=r)return s+(o-s)*Ss((i-n)/(r-n))}return t[t.length-1][1]}var qn={C:{r:.36,c:3817291},H:{r:.23,c:15922165},O:{r:.36,c:16726843},Br:{r:.5,c:10829870,bond:1.94},Cl:{r:.42,c:2274138,bond:1.79},I:{r:.56,c:9060272,bond:2.14}};function bl(i,t){t=t||{};let e=za[t.template||"sn2"];if(!e)throw new Error("unknown 3D template "+t.template);if(!document.getElementById("mbx-css")){let _=document.createElement("style");_.id="mbx-css",_.textContent=yr,document.head.appendChild(_)}let n=null,s="Br";i.innerHTML=`<div class="mbx">
    <div class="mbx-stage"><canvas></canvas><div class="mbx-labels"></div>
      <div class="mbx-hud"><div class="mbx-chip"><small data-r="stepn">3D Tutor</small><b data-r="stept">${ji(e.title)}</b></div>
        <div class="mbx-chip mbx-energy"><small>Energy profile</small><svg viewBox="0 0 224 116"><line x1="14" y1="104" x2="214" y2="104" stroke="#3a3f58"/><line x1="14" y1="104" x2="14" y2="8" stroke="#3a3f58"/>
          <path data-r="ecurve" fill="none" stroke="#8fb2ff" stroke-width="2.2"/><text x="16" y="113" font-size="9" fill="#6b7086">reactants</text><text x="172" y="113" font-size="9" fill="#6b7086">products</text>
          <text data-r="ets" x="104" y="20" font-size="13" fill="#ffc040">\u2021</text><circle data-r="edot" r="5.5" fill="#ffc040" stroke="#fff" stroke-width="1.5"/></svg></div></div>
      <div class="mbx-meters"><div class="mbx-chip"><div class="mbx-bar"><span>C\u2013O</span><i><em data-r="bo"></em></i></div><div class="mbx-bar"><span data-r="bxl">C\u2013Br</span><i><em data-r="bb"></em></i></div></div>
        <div class="mbx-chip" style="text-align:center"><small>Config</small><b class="mbx-cfg" data-r="cfg">(S)</b></div></div>
      <div class="mbx-badge" data-r="badge">Drag to turn \xB7 pinch to zoom</div></div>
    <div class="mbx-card"><div class="mbx-cap" data-r="cap"></div>
      <div class="mbx-quiz" data-r="quiz" hidden><button data-r="revealbtn">Tap to reveal</button><div class="mbx-reveal" data-r="reveal" hidden></div></div>
      <div class="mbx-ctl"><button class="mbx-play" data-r="play">\u25B6 Start the lesson</button><button data-r="prev" aria-label="Previous step">\u25C0</button><button data-r="next" aria-label="Next step">\u25B6</button>
        <span class="sp"></span><button data-r="slow">Slow motion</button><button data-r="mute" aria-label="Mute">\u{1F50A}</button></div>
      <div class="mbx-chaps" data-r="chaps" style="margin-top:10px"></div></div>
    <div class="mbx-card"><h4>Mechanism figure</h4><div data-r="fig"></div></div>
    <div class="mbx-cols"><div class="mbx-card"><h4>Key to the figure</h4><ul class="mbx-key" data-r="key"></ul></div>
      <div class="mbx-card"><h4 data-r="lineshd">Key points</h4><ol class="mbx-lines" data-r="lines"></ol></div></div>
    <div class="mbx-legend"><span><em style="background:#3a3f4b;border:1px solid #777"></em>C</span><span><em style="background:#f2f3f5;border:1px solid #bbb"></em>H</span><span><em style="background:#ff3b3b"></em>O</span><span><em data-r="lgdot" style="background:#a5402e"></em><span data-r="lgname">Br</span></span><span><em style="background:#ffc040"></em>bond forming / breaking \xB7 being explained</span></div>
  </div>`;let r={};i.querySelectorAll("[data-r]").forEach(_=>r[_.dataset.r]=_);let o=i.querySelector(".mbx-stage"),a=o.querySelector("canvas"),c=o.querySelector(".mbx-labels"),h=matchMedia("(prefers-reduced-motion: reduce)"),d=new ki({canvas:a,antialias:!0,alpha:!0});d.setPixelRatio(Math.min(2,window.devicePixelRatio||1)),d.outputColorSpace=De,d.toneMapping=vs,d.toneMappingExposure=1.05;let u=new Gn,f=new Vn(d);u.environment=f.fromScene(new Ki,.04).texture,u.environmentIntensity=.75;let p=new Re(34,1,.1,200);u.add(new qi(16777215,2633796,.8));let g=new Xn(16777215,1.8);g.position.set(-4,8,9),u.add(g);let x=new Xn(9417471,1.2);x.position.set(6,2,-8),u.add(x);let m=new Vi(1,40,28),l=new li(1,1,1,18,1),E=new $e;u.add(E);let y={},v=[],D="",I=_=>y[_].e;function P(_){return new mn({color:qn[_].c,roughness:_==="H"?.35:.3,clearcoat:.6,clearcoatRoughness:.2,emissive:16756736,emissiveIntensity:0})}function N(_,A){let T=new Yt(m,P(A));T.scale.setScalar(qn[A].r),E.add(T),y[_]={id:_,e:A,m:T,p:new L}}function w(_,A,T){let C=[_,A].map(st=>new Yt(l,new mn({color:qn[I(st)].c,roughness:.35,clearcoat:.4})));C.forEach(st=>E.add(st));let z=new ke({color:16760896,transparent:!0}),Z=[];if(T)for(let st=0;st<5;st++){let it=new Yt(l,z);E.add(it),Z.push(it)}v.push({a:_,b:A,strength:T,half:C,dashes:Z,dashMat:z})}let b=ye(0,1,0),U=new L;function V(_,A,T,C){U.subVectors(T,A);let z=U.length();_.position.addVectors(A,T).multiplyScalar(.5),_.quaternion.setFromUnitVectors(b,U.normalize()),_.scale.set(C,z,C)}function H(){E.traverse(_=>{_.material&&_.material.dispose(),_.geometry&&_.geometry!==m&&_.geometry!==l&&_.geometry.dispose()}),E.clear()}function W(_){H(),y={},v=[],D=_,N("C2","C"),N("O","O"),N("X",s),N("HO","H"),(_==="tert"?[["Me1","Me"],["Me2","Me"],["Me3","Me"]]:[["Me","Me"],["H2","H"],["Et","Et"]]).forEach(([T,C])=>{if(C==="H"&&(N(T,"H"),w("C2",T)),C==="Me"){N(T+"C","C"),w("C2",T+"C");for(let z=0;z<3;z++)N(T+"H"+z,"H"),w(T+"C",T+"H"+z)}if(C==="Et"){N("EtC","C"),N("EtC2","C"),w("C2","EtC"),w("EtC","EtC2");for(let z=0;z<2;z++)N("EtH"+z,"H"),w("EtC","EtH"+z);for(let z=0;z<3;z++)N("EtC2H"+z,"H"),w("EtC2","EtC2H"+z)}}),w("O","HO"),w("C2","X","CX"),w("C2","O","CO"),at()}function $(_,A,T){let C=Math.abs(_.z)<.9?ye(0,0,1):ye(0,1,0),z=new L().crossVectors(_,C).normalize(),Z=new L().crossVectors(_,z),st=[];for(let it=0;it<A;it++){let bt=T+it*Math.PI*2/A;st.push(_.clone().multiplyScalar(.334).addScaledVector(z,.943*Math.cos(bt)).addScaledVector(Z,.943*Math.sin(bt)).normalize())}return st}let G={};function rt(_){let A=D==="tert",T=(_t,jt)=>y[_t]&&y[_t].p.copy(jt),C=qn[s].bond,z=A?bs(_,[[0,6.6],[.42,3.4],[.5,3.15],[.6,3.5],[1,6.6]]):bs(_,[[0,6.6],[.3,3.2],[.5,2.05],[.66,1.6],[.8,1.43],[1,1.43]]),Z=A?C+.03:bs(_,[[0,C],[.3,C+.03],[.5,C+.44],[.66,C+1.16],[.82,C+2.36],[1,C+3.86]]),st=A?-.334:-.334*Math.cos(Math.PI*Ss((_-.22)/.56)),it=Math.sqrt(1-st*st);T("C2",ye(0,0,0)),T("X",ye(Z,0,0)),T("O",ye(-z,0,0));let bt=ye(-.33,.94*Math.cos(1.05),.94*Math.sin(1.05)).normalize();T("HO",y.O.p.clone().addScaledVector(bt,.96));let Ot={Me:0,H2:2*Math.PI/3,Et:4*Math.PI/3,Me1:0,Me2:2*Math.PI/3,Me3:4*Math.PI/3};Object.entries(Ot).forEach(([_t,jt])=>{let re=ye(st,it*Math.cos(jt),it*Math.sin(jt));if(_t==="H2"&&y.H2&&T("H2",re.clone().multiplyScalar(1.09)),_t.startsWith("Me")&&y[_t+"C"]){let Ht=re.clone().multiplyScalar(1.53);T(_t+"C",Ht),$(re,3,.5+jt).forEach((me,qt)=>T(_t+"H"+qt,Ht.clone().addScaledVector(me,1.09)))}if(_t==="Et"&&y.EtC){let Ht=re.clone().multiplyScalar(1.53);T("EtC",Ht);let me=$(re,3,.9),qt=Ht.clone().addScaledVector(me[0],1.53);T("EtC2",qt),T("EtH0",Ht.clone().addScaledVector(me[1],1.09)),T("EtH1",Ht.clone().addScaledVector(me[2],1.09)),$(me[0],3,.3).forEach((Lt,je)=>T("EtC2H"+je,qt.clone().addScaledVector(Lt,1.09)))}}),G.dO=z,G.sCX=A?1:bs(_,[[0,1],[.32,1],[.5,.5],[.7,0]]),G.sCO=A?0:bs(_,[[0,0],[.32,0],[.5,.5],[.7,1]])}function q(){if(D==="tert"||G.sCO>.38&&G.sCO<.62)return"";let _=y.C2.p,T=(G.sCO>.5?y.O.p:y.X.p).clone().sub(_),C=y.EtC.p.clone().sub(_),z=y.MeC.p.clone().sub(_),Z=y.H2.p.clone().sub(_);return new L().crossVectors(C.clone().sub(T),z.clone().sub(C)).dot(Z)>0?"R":"S"}function ut(){Object.values(y).forEach(_=>_.m.position.copy(_.p)),v.forEach(_=>{let A=y[_.a].p,T=y[_.b].p,C=A.clone().lerp(T,.5),z=_.strength?_.strength==="CX"?G.sCX:G.sCO:1,Z=z>.92,st=z>.06&&!Z;_.half.forEach((it,bt)=>{it.visible=Z,Z&&V(it,bt?C:A,bt?T:C,.1)}),_.dashes.forEach((it,bt)=>{it.visible=st,st&&V(it,A.clone().lerp(T,(bt+.15)/5),A.clone().lerp(T,(bt+.65)/5),.065)}),_.dashMat.opacity=.35+.65*Math.sin(Math.PI*z)})}let Mt,Ct=[],Gt=[],se=[];function J(_,A){return new Yt(m,new mn({color:_,transparent:!0,opacity:A,roughness:.2,clearcoat:1,depthWrite:!1,side:sn,emissive:_,emissiveIntensity:.25}))}function at(){Mt=new $e;let _=J(16760896,.38),A=J(5213695,.38);_.scale.set(.95,.62,.62),_.position.set(-.95,0,0),A.scale.set(.42,.36,.36),A.position.set(.52,0,0),Mt.add(_,A),E.add(Mt),Ct=[0,1,2].map(()=>{let T=J(8377343,.32);return T.scale.set(.22,.22,.42),E.add(T),T}),Gt=[0,1].map(()=>{let T=new $e,C=new ke({color:16760896,transparent:!0}),z=new Yt(new He,C),Z=new Yt(new Hi(.16,.42,16),C),st=new Yt(m,new ke({color:16777215})),it=new Yt(m,st.material);return st.scale.setScalar(.085),it.scale.setScalar(.085),T.add(z,Z,st,it),E.add(T),{g:T,tube:z,head:Z,e1:st,e2:it,mat:C}}),se=[],Object.values(y).forEach(T=>{if(T.e==="H"&&T.id!=="HO"){let C=J(10466559,.07);C.scale.setScalar(1.1),C.userData.a=T.id,E.add(C),se.push(C)}})}function Rt(_,A,T,C,z){if(_.g.visible=z>.01,!_.g.visible)return;let Z=new Wn(A,A.clone().lerp(T,.5).add(C),T);_.tube.geometry.dispose(),_.tube.geometry=new Gi(Z,40,.05,8,!1),_.head.position.copy(Z.getPoint(1)),_.head.quaternion.setFromUnitVectors(b,Z.getTangent(1)),_.mat.opacity=z;let st=performance.now()/1300%1;_.e1.position.copy(Z.getPoint(st)).add(ye(0,.07,0)),_.e2.position.copy(Z.getPoint(st)).add(ye(0,-.07,0))}function mt(_,A){let T=D==="tert",C=y.C2.p,z=y.O.p,Z=A.sigma&&!T?Ke(1-(_-.36)/.12,0,1):0;Mt.visible=Z>.01,Mt.children.forEach(Ht=>Ht.material.opacity=.38*Z),Mt.position.copy(C);let st=y.HO.p.clone().sub(z).normalize(),it=0,bt=-9;for(let Ht=0;Ht<36;Ht++){let me=$(st.clone().negate(),3,Ht/36*2.094)[0];me.x>bt&&(bt=me.x,it=Ht/36*2.094)}let Ot=A.lp?Ke(1-(G.sCO-.2)/.3,0,1):0;$(st.clone().negate(),3,it).forEach((Ht,me)=>{let qt=Ct[me];qt.visible=Ot>.01,qt.position.copy(z).addScaledVector(Ht,.52),qt.quaternion.setFromUnitVectors(ye(0,0,1),Ht),qt.material.opacity=.34*Ot,qt.material.color.set(me===0&&_>.12&&A.arrows?16760896:8377343),qt.material.emissive.copy(qt.material.color)});let _t=A.arrows&&A.arrows.includes(1)&&!T?Ke((.56-_)/.08,0,1):0,jt=A.arrows&&A.arrows.includes(2)&&!T?Ke((.7-_)/.08,0,1):0;Rt(Gt[0],Ct[0].position.clone().add(ye(.25,0,0)),z.clone().lerp(C,.62).add(ye(0,.25,0)),ye(0,1.4,.2),_t);let re=C.clone().lerp(y.X.p,.5);Rt(Gt[1],re.clone().add(ye(0,.15,0)),y.X.p.clone().add(ye(.15,qn[s].r+.12,0)),ye(0,1.15,.1),jt),se.forEach(Ht=>{Ht.visible=!!A.vdw,Ht.position.copy(y[Ht.userData.a].p),Ht.material.opacity=(A.vdw?.07:0)*(T&&G.dO<3.6?1.8:1),Ht.material.color.set(T&&G.dO<3.45?16739179:10466559)})}let St=_=>(D==="tert"?.85:1)*Math.exp(-(((_-.5)/.17)**2))-.32*Ss((_-.3)/.45)*(D==="tert"?0:1),At=_=>16+_*192,Ft=_=>92-_*64;function ae(){let _="";for(let A=0;A<=80;A++){let T=A/80;_+=(A?"L":"M")+At(T).toFixed(1)+" "+Ft(St(T)).toFixed(1)}r.ecurve.setAttribute("d",_),r.ets.setAttribute("y",(Ft(St(.5))-8).toFixed(1))}let Dt={t:ye(0,0,0),d:14,yaw:-50,pitch:30},te={t:ye(0,0,0),d:14,yaw:0,pitch:10},B={yaw:0,pitch:0,z:1},we=0,Kt=0;function $t(){let _=o.clientWidth,A=o.clientHeight;!_||!A||(d.setSize(_,A,!1),p.aspect=_/A,p.updateProjectionMatrix())}function Ut(_){var A,T;_=_||{},B={yaw:0,pitch:0,z:1},te.t.set(..._.t||[-.6,0,0]),te.yaw=(A=_.yaw)!=null?A:0,te.pitch=(T=_.pitch)!=null?T:10,we=_.orbit||0,te.d=(_.d||14)*(p.aspect<1?1.45:1)}function ce(_){let A=h.matches?1:1-Math.exp(-_/.7);Dt.t.lerp(te.t,A),Dt.d+=(te.d-Dt.d)*A,Dt.yaw+=(te.yaw-Dt.yaw)*A,Dt.pitch+=(te.pitch-Dt.pitch)*A,Kt+=_,h.matches||(te.yaw+=we*_);let T=di.degToRad(Dt.yaw+B.yaw+Math.sin(Kt*.2)*2.5),C=di.degToRad(Ke(Dt.pitch+B.pitch+Math.sin(Kt*.27)*1.5,-80,80)),z=Dt.d/B.z;p.position.set(Dt.t.x+Math.sin(T)*Math.cos(C)*z,Dt.t.y+Math.sin(C)*z,Dt.t.z+Math.cos(T)*Math.cos(C)*z),p.lookAt(Dt.t)}let It=!1,R=0,M=0,k=0,j=(_,A,T,C)=>{_.addEventListener(A,T,C)};j(o,"pointerdown",_=>{It=!0,R=_.clientX,M=_.clientY;try{o.setPointerCapture(_.pointerId)}catch{}}),j(o,"pointermove",_=>{It&&(B.yaw-=(_.clientX-R)*.35,B.pitch=Ke(B.pitch+(_.clientY-M)*.3,-70,70),R=_.clientX,M=_.clientY)}),j(o,"pointerup",()=>{It=!1}),j(o,"pointercancel",()=>{It=!1}),j(o,"wheel",_=>{_.preventDefault(),B.z=Ke(B.z*(1-_.deltaY*.001),.5,3)},{passive:!1}),j(o,"touchmove",_=>{if(_.touches.length===2){let A=Math.hypot(_.touches[0].clientX-_.touches[1].clientX,_.touches[0].clientY-_.touches[1].clientY);k&&(B.z=Ke(B.z*A/k,.5,3)),k=A}},{passive:!0}),j(o,"touchend",()=>{k=0});let nt={Me:["MeC","MeH0","MeH1","MeH2"],Et:["EtC","EtC2","EtH0","EtH1","EtC2H0","EtC2H1","EtC2H2"],H2:["H2"],O:["O","HO"],C2:["C2"],Br:["X"]},K=()=>({O:["1","Nucleophile \xB7 HO\u207B","O"],C2:["3","Electrophilic carbon","C2"],Br:["5","Leaving group \xB7 "+s,"X"],Me:["","Methyl","MeC"],Et:["","Ethyl","EtC"],H2:["","Hydrogen","H2"]}),lt={};function dt(_,A){let T=document.createElement("div");return T.className=_,T.innerHTML=A,c.appendChild(T),T}function vt(_,A,T=0){let C=A.clone().project(p);_.style.transform=`translate(${((C.x+1)/2*o.clientWidth).toFixed(1)}px, ${((1-C.y)/2*o.clientHeight+T).toFixed(1)}px)`,_.hidden=C.z>1}function Zt(_,A,T,C=.62){let z="q"+_+A;lt[z]=lt[z]||dt("mbx-q",A),lt[z].style.opacity=T?1:0,y[_]&&vt(lt[z],y[_].p.clone().add(ye(0,C,.15)))}function ot(_,A){let T=D==="tert",C=qn[s].r+.3;Zt("C2","\u03B4+",!T&&_<.4&&(A.charges||A.overview)),Zt("X","\u03B4\u2212",_<.4&&(A.charges||A.overview)||_>=.4&&_<.66,C),Zt("O","\u2212",_<.32||T),Zt("O","\u03B4\u2212",!T&&_>=.32&&_<.66),Zt("X","\u2212",!T&&_>=.66,C),lt.ts=lt.ts||dt("mbx-ts","\u2021"),lt.ts.style.opacity=!T&&_>.42&&_<.58?1:0,vt(lt.ts,ye(0,2.4,0)),lt.block=lt.block||dt("mbx-block","Blocked \u2014 no room behind carbon"),lt.block.style.opacity=T&&G.dO<3.45?1:0,vt(lt.block,ye(-2.2,1.8,0));let z=!!A.cip&&!T;[[G.sCO>.5?"O":"X","1"],["EtC","2"],["MeC","3"],["H2","4"]].forEach(([it,bt],Ot)=>{let _t="cip"+Ot;lt[_t]=lt[_t]||dt("mbx-cip",""),lt[_t].textContent=bt,lt[_t].style.opacity=z?1:0,y[it]&&vt(lt[_t],y[it].p.clone().add(ye(0,-.55,.3)))});let st=K();(A.focus||[]).forEach(it=>{let bt="f"+it,Ot=st[it];!Ot||!y[Ot[2]]||(lt[bt]=lt[bt]||dt("mbx-tag",""),lt[bt].innerHTML=`${Ot[0]?`<b>${Ot[0]}</b>`:""}${ji(Ot[1])}`,vt(lt[bt],y[Ot[2]].p,46))}),Object.keys(lt).filter(it=>it[0]==="f").forEach(it=>lt[it].style.opacity=(A.focus||[]).includes(it.slice(1))&&!T?1:0)}function ht(_,A){let T=new Set;(_.focus||[]).forEach(C=>(nt[C]||[]).forEach(z=>T.add(z))),Object.values(y).forEach(C=>C.m.material.emissiveIntensity=T.has(C.id)?.18+.1*Math.sin(A*4):0)}function Tt(){r.fig.innerHTML=e.figure(s),r.key.innerHTML=e.key(s).map((_,A)=>`<li data-n="${A+1}"><b>${A+1}</b>${ji(_)}</li>`).join(""),r.key.querySelectorAll("li").forEach(_=>_.onclick=()=>{let A=+_.dataset.n,T=ct().findIndex(C=>(C.note||[]).includes(A)&&C.note.length<4);T>=0&&pt(T)})}function Bt(_){let A=r.fig.querySelector("#mbx-nholes"),T=r.fig.querySelector("#mbx-nrings"),C=r.fig.querySelector("#mbx-ndimrect");A&&(A.innerHTML="",T.innerHTML="",(_||[]).forEach(z=>{let Z=e.regions[z];Z&&(A.insertAdjacentHTML("beforeend",`<ellipse cx="${Z[0]}" cy="${Z[1]}" rx="${Z[2]}" ry="${Z[3]}" filter="url(#mbx-nfeather)"/>`),T.insertAdjacentHTML("beforeend",`<ellipse cx="${Z[0]}" cy="${Z[1]}" rx="${Z[2]}" ry="${Z[3]}"><animate attributeName="stroke-dashoffset" from="0" to="-26" dur="1s" repeatCount="indefinite"/></ellipse>`))}),C.setAttribute("opacity",_&&_.length?.55:0))}function ct(){return e.steps.map(_=>{let A=n&&n.steps&&n.steps[_.id],T=Object.assign({},_);return A&&A.say&&(T.say=A.say),_.quiz&&n&&n.quiz&&(n.quiz.say&&(T.say=n.quiz.say),n.quiz.answer&&(T.answer=n.quiz.answer)),T})}function Wt(_){n=_||null;let A=n&&qn[n.lg]&&["Br","Cl","I"].includes(n.lg)?n.lg:"Br",T=n&&Array.isArray(n.lines)&&n.lines.length?n.lines:e.lines;r.lineshd.textContent=n&&n.personal?"From your note":"Key points",r.lines.innerHTML=T.map(C=>`<li>${ji(C)}</li>`).join(""),r.chaps.innerHTML=ct().map((C,z)=>`<button data-i="${z}">${z+1}. ${ji(C.title)}</button>`).join(""),r.chaps.querySelectorAll("button").forEach(C=>C.onclick=()=>pt(+C.dataset.i)),r.badge.textContent=n&&n.personal?"\u2713 Matched to your note":"Drag to turn \xB7 pinch to zoom",r.badge.classList.toggle("ok",!!(n&&n.personal)),(A!==s||!D)&&(s=A,W(D||"normal"),Tt(),r.bxl.textContent="C\u2013"+s,r.lgname.textContent=s,r.lgdot.style.background="#"+qn[s].c.toString(16).padStart(6,"0")),Me>=0&&et()}let Nt=0,Et=null,F=0,ft=1;function X(_){Et=Object.assign({from:0,to:0,dur:1,loop:"none",hold:0,delay:0},_),F=-.8,Et.pre=Nt}function Q(_){if(!Et)return;if(F+=_/ft,F<0){Nt=Et.pre+(Et.from-Et.pre)*Ss(1+F/.8);return}let A=F-Et.delay;if(A<0){Nt=Et.from;return}let T=Et.dur+Et.hold+(Et.loop==="repeat"?.9:0),C=Ke((Et.loop!=="none"?A%T:A)/Et.dur,0,1);Nt=Et.from+(Et.to-Et.from)*(Et.loop==="repeat"?C:Ss(C)),Et.wobble&&(Nt+=Math.sin(A*5)*Et.wobble)}let gt=0,xt=!1,zt=_=>String(_||"").split(/(?<=[.!?])\s+/).filter(Boolean);function ue(_,A){r.cap.innerHTML=zt(_).map((T,C)=>`<span class="${C===A?"on":""}">${ji(T)}</span>`).join(" ")}function ve(_,A){try{let T=new SpeechSynthesisUtterance(_);T.lang="en-GB",T.onend=()=>A&&A(),T.onerror=()=>A&&A(),speechSynthesis.speak(T)}catch{A&&A()}}function ne(){try{t.speak?t.speak(null):window.speechSynthesis&&speechSynthesis.cancel()}catch{}}function Te(_,A){let T=++gt,C=zt(_);ne();let z=0,Z=()=>{if(T!==gt)return;if(z>=C.length)return A&&A();ue(_,z);let st=C[z++],it=!1,bt=()=>{it||(it=!0,T===gt&&setTimeout(Z,120))};if(xt)return setTimeout(bt,900+st.length*60);setTimeout(bt,4e3+st.length*140),t.speak?t.speak(st,bt):ve(st,bt)};Z()}function ze(_){if(!t.warm)return;let A=ct(),T=[];[_,_+1].forEach(C=>{A[C]&&T.push(...zt(A[C].say))});try{t.warm(T)}catch{}}let Me=-1,Xe=!1,O=0,Y=e.steps[0];function et(){let _=ct()[Me];if(!_)return;Y=_,r.stepn.textContent=`Step ${Me+1} of ${e.steps.length}`,r.stept.textContent=_.title,r.chaps.querySelectorAll("button").forEach((T,C)=>T.classList.toggle("on",C===Me)),r.key.querySelectorAll("li").forEach(T=>T.classList.toggle("on",(_.note||[]).includes(+T.dataset.n))),r.lines.querySelectorAll("li").forEach((T,C)=>T.classList.toggle("on",C===_.line));let A=r.chaps.querySelector("button.on");A&&r.chaps.scrollTo({left:A.offsetLeft-40,behavior:"smooth"})}function pt(_){clearTimeout(O),Me=Ke(_,0,e.steps.length-1),et();let A=Y;(A.mode||"normal")!==D&&(W(A.mode||"normal"),Nt=A.play?A.play.from:0,ae()),Bt(A.note),Ut(A.shot),X(A.play||{}),r.quiz.hidden=!A.quiz,r.reveal.hidden=!0,ze(Me),Xe?Te(A.say,()=>{Xe&&Me===_&&!A.quiz&&Me+1<e.steps.length?O=setTimeout(()=>pt(Me+1),900):Me+1>=e.steps.length&&Pt(!1)}):ue(A.say,-1)}function Pt(_){Xe=_,r.play.textContent=_?"\u275A\u275A Pause":Me<0?"\u25B6 Start the lesson":"\u25B6 Resume",_?pt(Me<0?0:Me):(gt++,ne())}r.play.onclick=()=>Pt(!Xe),r.next.onclick=()=>pt(Me+1),r.prev.onclick=()=>pt(Me-1),r.mute.onclick=()=>{xt=!xt,r.mute.textContent=xt?"\u{1F507}":"\u{1F50A}",Xe&&pt(Me)},r.slow.onclick=()=>{ft=ft>1?1:3,r.slow.textContent=ft>1?"Normal speed":"Slow motion"},r.revealbtn.onclick=()=>{r.reveal.hidden=!1,r.reveal.textContent=Y.answer||"",Xe&&Y.answer&&Te(Y.answer,()=>{})};let Vt=0,wt="",le=0,Xt=!1;function ee(_){if(Xt)return;if(!i.isConnected){Ne();return}le=requestAnimationFrame(ee);let A=Vt?Math.min(.1,(_-Vt)/1e3):.016;Vt=_,h.matches?Et&&(Nt=Et.to):Q(A);let T=Ke(Nt,0,1);rt(T),ut(),mt(T,Y),ht(Y,_/1e3),r.edot.setAttribute("cx",At(T).toFixed(1)),r.edot.setAttribute("cy",Ft(St(T)).toFixed(1));let C=q();C!==wt&&(wt=C,r.cfg.textContent=C?`(${C})`:"\u2014",r.cfg.classList.toggle("r",C==="R")),r.bo.style.width=(G.sCO*100).toFixed(0)+"%",r.bb.style.width=(G.sCX*100).toFixed(0)+"%",ce(A),ot(T,Y),d.render(u,p)}let he=new ResizeObserver($t);he.observe(o);function Ne(){if(!Xt){Xt=!0,cancelAnimationFrame(le),gt++,ne(),clearTimeout(O),he.disconnect(),H(),m.dispose(),l.dispose();try{u.environment&&u.environment.dispose(),f.dispose()}catch{}d.dispose();try{d.forceContextLoss()}catch{}}}return $t(),Wt(t.lesson||null),ae(),Ut(e.steps[0].shot),Dt.d=te.d*1.5,X(e.steps[0].play),Y=ct()[0],Bt([]),ue("Press \u201CStart the lesson\u201D. Drag to turn the molecules, pinch to zoom.",-1),le=requestAnimationFrame(ee),{setLesson:Wt,destroy:Ne,go:pt,setPlay:Pt,_s:()=>Nt,_set:_=>{Et=null,Nt=_},_cfg:q,_settle:()=>{Dt.t.copy(te.t),Dt.d=te.d,Dt.yaw=te.yaw,Dt.pitch=te.pitch}}}var Qi={H:{ve:1,r:.31,val:[1]},B:{ve:3,r:.84,val:[3]},C:{ve:4,r:.76,val:[4]},N:{ve:5,r:.71,val:[3,5]},O:{ve:6,r:.66,val:[2]},F:{ve:7,r:.57,val:[1]},P:{ve:5,r:1.07,val:[3,5]},S:{ve:6,r:1.05,val:[2,4,6]},Cl:{ve:7,r:1.02,val:[1]},Br:{ve:7,r:1.2,val:[1]},I:{ve:7,r:1.39,val:[1]},Li:{ve:1,r:1.28,val:[1]},Na:{ve:1,r:1.66,val:[1]},K:{ve:1,r:2.03,val:[1]},Mg:{ve:2,r:1.41,val:[2]},Si:{ve:4,r:1.11,val:[4]},Se:{ve:6,r:1.2,val:[2]},Al:{ve:3,r:1.21,val:[3]},Fe:{ve:2,r:1.32,val:[2,3]},Zn:{ve:2,r:1.22,val:[2]}},Jm=["Cl","Br","B","C","N","O","P","S","F","I"],ka={b:"B",c:"C",n:"N",o:"O",p:"P",s:"S"};function Km(i){let t=String(i||"").trim();if(!t)throw new Error("empty SMILES");let e=[],n=[],s={},r=0,o=-1,a=null,c=[],h=(u,f,p)=>{if(u===f)throw new Error("atom bonded to itself");if(n.some(m=>m.a===u&&m.b===f||m.a===f&&m.b===u))throw new Error("duplicate bond");let g=e[u].arom&&e[f].arom,x=p==="="?2:p==="#"?3:p===":"?1.5:p==="-"||p==="/"||p==="\\"?1:g?1.5:1;n.push({a:u,b:f,order:x})},d=(u,f,p)=>{h(u,f,p),e[u].nb.push(f),e[f].nb.push(u)};for(;r<t.length;){let u=t[r];if(u==="("){if(o<0)throw new Error("branch before any atom");c.push(o),r++;continue}if(u===")"){if(!c.length)throw new Error("unbalanced )");o=c.pop(),r++;continue}if("-=#:/\\".includes(u)){a=u,r++;continue}if(u==="."){o=-1,a=null,r++;continue}if(/[0-9%]/.test(u)){let g;if(u==="%"?(g=t.slice(r+1,r+3),r+=3):(g=u,r++),o<0)throw new Error("ring number before any atom");if(s[g]){let x=s[g];h(x.atom,o,a||x.sym),e[x.atom].nb[x.slot]=o,e[o].nb.push(x.atom),delete s[g]}else s[g]={atom:o,sym:a,slot:e[o].nb.length},e[o].nb.push(-1);a=null;continue}let f;if(u==="["){let g=t.indexOf("]",r);if(g<0)throw new Error("unclosed [");let x=/^(\d+)?([A-Z][a-z]?|[a-z][a-z]?|\*)(@@|@)?(H\d?)?([+-]+\d*|[+-]\d+)?(?::(\d+))?$/.exec(t.slice(r+1,g));if(!x)throw new Error("bad bracket atom ["+t.slice(r+1,g)+"]");let m=x[2],l=!1;if(/^[a-z]/.test(m)&&(l=!0,m=ka[m]||(m==="se"?"Se":null),!m))throw new Error("unknown aromatic atom "+x[2]);if(!Qi[m])throw new Error("unsupported element "+m);let E=0;if(x[5]){let y=x[5][0]==="+"?1:-1,v=x[5].replace(/[+-]/g,"");E=y*(v?+v:x[5].length)}f={el:m,arom:l,charge:E,hx:x[4]?x[4].length>1?+x[4].slice(1):1:0,bracket:!0,chiral:x[3]||null,map:x[6]?+x[6]:0},r=g+1}else{let g=null;for(let x of Jm)if(t.startsWith(x,r)){g=x;break}if(!g&&ka[u])f={el:ka[u],arom:!0,charge:0,hx:0,bracket:!1,chiral:null,map:0},r++;else if(g)f={el:g,arom:!1,charge:0,hx:0,bracket:!1,chiral:null,map:0},r+=g.length;else throw new Error("unexpected character '"+u+"' in SMILES")}f.nb=[],f.hasPrev=o>=0;let p=e.push(f)-1;o>=0&&d(o,p,a),a=null,o=p}if(c.length)throw new Error("unbalanced (");if(Object.keys(s).length)throw new Error("unclosed ring "+Object.keys(s).join(","));return e.forEach((u,f)=>{let p=n.filter(l=>l.a===f||l.b===f).reduce((l,E)=>l+(E.order===1.5?1:E.order),0);if(u.bracket){u.h=u.hx;return}let g=Qi[u.el].val,x=p+(u.arom?1:0),m=g.find(l=>l>=x);u.h=m===void 0?0:Math.max(0,m-x)}),{atoms:e,bonds:n}}function El(i,t,e,n){let s=Qi[i].ve-t-e-n;return Math.max(0,Math.floor(s/2))}var jm={H:{0:[1],1:[0],"-1":[0]},B:{0:[3],"-1":[4]},C:{0:[4],1:[3],"-1":[3]},N:{0:[3],1:[4],"-1":[2]},O:{0:[2],1:[3],"-1":[1]},F:{0:[1],"-1":[0]},Cl:{0:[1],"-1":[0],1:[2]},Br:{0:[1],"-1":[0],1:[2]},I:{0:[1],"-1":[0],1:[2]},S:{0:[2,4,6],1:[3],"-1":[1]},P:{0:[3,5],1:[4]},Li:{0:[1],1:[0]},Na:{0:[1],1:[0]},K:{0:[1],1:[0]},Mg:{0:[2],2:[0],1:[1]}};function Ha(i){let t=Km(i),e=[];t.atoms.forEach((r,o)=>{let a=t.bonds.filter(h=>h.a===o||h.b===o).reduce((h,d)=>h+d.order,0)+r.h;r.bondSum=a-r.h;let c=(jm[r.el]||{})[r.charge];c&&!r.arom&&!c.some(h=>Math.abs(h-a)<.01)&&e.push(`${r.el}${r.map?":"+r.map:""} has ${a} bonds with charge ${r.charge}`),r.el!=="H"&&!r.map&&e.push(`heavy atom ${r.el} (position ${o+1}) has no map number`)});let n=t.atoms.filter(r=>r.map).map(r=>r.map),s=n.filter((r,o)=>n.indexOf(r)!==o);return s.length&&e.push("map number used twice: "+[...new Set(s)].join(",")),{g:t,errs:e,charge:t.atoms.reduce((r,o)=>r+o.charge,0)}}var vr=(i,t)=>i<t?i+"-"+t:t+"-"+i;function Sl(i){let t={};return i.bonds.forEach(e=>{let n=i.atoms[e.a].map,s=i.atoms[e.b].map;n&&s&&(t[vr(n,s)]=e.order)}),t}function wl(i){let t=[],e=[];if(!i||!Array.isArray(i.states)||i.states.length<2)return{ok:!1,errors:["need at least 2 states"],warnings:e};i.states.length>8&&t.push("at most 8 states");let n=i.states.map((h,d)=>{try{let u=Ha(h.smiles);return u.errs.forEach(f=>t.push(`state ${d+1}: ${f}`)),u}catch(u){return t.push(`state ${d+1}: SMILES error \u2014 ${u.message}`),null}});if(n.some(h=>!h))return{ok:!1,errors:t,warnings:e};let s=h=>{let d={};return h.atoms.forEach(u=>{u.map&&(d[u.map]=u.el)}),d},r=h=>{let d={};return h.atoms.forEach((u,f)=>{if(!u.map)return;let p=u.h;h.bonds.forEach(g=>{let x=g.a===f?g.b:g.b===f?g.a:-1;x>=0&&h.atoms[x].el==="H"&&!h.atoms[x].map&&p++}),d[u.map]=p}),d},o=s(n[0].g),a=r(n[0].g);n.forEach((h,d)=>{if(d===0)return;let u=s(h.g),f=r(h.g),p=Object.keys(o).sort().join(),g=Object.keys(u).sort().join();p!==g&&t.push(`state ${d+1} has different map numbers from state 1 (every state must contain exactly the same mapped atoms)`),Object.keys(o).forEach(x=>{u[x]&&u[x]!==o[x]&&t.push(`map ${x} is ${o[x]} in state 1 but ${u[x]} in state ${d+1}`)}),Object.keys(a).forEach(x=>{x in f&&f[x]!==a[x]&&o[x]!=="H"&&t.push(`atom :${x} has ${a[x]} implicit H in state 1 but ${f[x]} in state ${d+1} \u2014 a hydrogen that moves must be written as an explicit mapped [H:n]`)}),h.charge!==n[0].charge&&t.push(`total charge changes: ${n[0].charge} in state 1, ${h.charge} in state ${d+1}`)});let c=Array.isArray(i.arrows)?i.arrows:[];for(let h=0;h<n.length-1;h++){let d=Sl(n[h].g),u=Sl(n[h+1].g),f=Array.isArray(c[h])?c[h]:[],p=new Set,g=new Set;new Set([...Object.keys(d),...Object.keys(u)]).forEach(l=>{let E=d[l]||0,y=u[l]||0;y>E+.01&&p.add(l),y<E-.01&&g.add(l)});let x=new Set,m=new Set;f.forEach((l,E)=>{let y=l&&l.from,v=l&&l.to;if(!Array.isArray(y)||!Array.isArray(v)||!y.length||!v.length){t.push(`step ${h+1} arrow ${E+1}: "from" and "to" must be [atom] or [atom,atom]`);return}[...y,...v].forEach(D=>{o[D]||t.push(`step ${h+1} arrow ${E+1}: unknown map number ${D}`)}),y.length===2&&(m.add(vr(y[0],y[1])),d[vr(y[0],y[1])]>0||t.push(`step ${h+1} arrow ${E+1}: starts from bond ${y[0]}-${y[1]}, which does not exist in state ${h+1}`)),v.length===2&&x.add(vr(v[0],v[1]))}),p.forEach(l=>{x.has(l)||t.push(`step ${h+1}: bond ${l} forms (or gains order) but no arrow points to it`)}),g.forEach(l=>{m.has(l)||t.push(`step ${h+1}: bond ${l} breaks (or loses order) but no arrow starts from it`)}),x.forEach(l=>{p.has(l)||e.push(`step ${h+1}: an arrow points to bond ${l} but that bond does not form`)}),!p.size&&!g.size&&t.push(`step ${h+1}: nothing changes between state ${h+1} and state ${h+2}`)}return{ok:!t.length,errors:[...new Set(t)].slice(0,20),warnings:e,parsed:n}}var tt={sub:(i,t)=>[i[0]-t[0],i[1]-t[1],i[2]-t[2]],add:(i,t)=>[i[0]+t[0],i[1]+t[1],i[2]+t[2]],mul:(i,t)=>[i[0]*t,i[1]*t,i[2]*t],dot:(i,t)=>i[0]*t[0]+i[1]*t[1]+i[2]*t[2],cross:(i,t)=>[i[1]*t[2]-i[2]*t[1],i[2]*t[0]-i[0]*t[2],i[0]*t[1]-i[1]*t[0]],len:i=>Math.hypot(i[0],i[1],i[2]),norm:i=>{let t=Math.hypot(i[0],i[1],i[2])||1;return[i[0]/t,i[1]/t,i[2]/t]}};function Qm(i){let t=i>>>0||1;return()=>(t^=t<<13,t^=t>>>17,t^=t<<5,(t>>>0)%1e5/1e5)}function tg(i){let t=i.map(o=>Ha(o.smiles).g),e=[],n={},s=(o,a,c)=>o.atoms[a].map?"m"+o.atoms[a].map:null,r=t.map(o=>{let a=[],c=[],h={};o.atoms.forEach((u,f)=>{u.map&&(h[f]="m"+u.map,a.push({id:"m"+u.map,el:u.el,charge:u.charge,chiral:u.chiral,nb:u.nb,hasPrev:u.hasPrev,h:u.h,k:f}))});let d={};return o.atoms.forEach((u,f)=>{if(!u.map&&u.el==="H"){let p=u.nb.find(l=>l>=0),g=o.atoms[p],x="m"+g.map;d[x]=d[x]||0;let m="h"+g.map+"_"+d[x]++;h[f]=m,a.push({id:m,el:"H",charge:0,parent:x})}}),a.filter(u=>u.id[0]==="m").forEach(u=>{for(let f=0;f<u.h;f++){let p="h"+u.id.slice(1)+"_"+(d[u.id]=d[u.id]||0);d[u.id]++,a.push({id:p,el:"H",charge:0,parent:u.id,implicitOf:!0}),c.push({a:u.id,b:p,order:1})}}),o.bonds.forEach(u=>c.push({a:h[u.a],b:h[u.b],order:u.order})),{atoms:a,bonds:c,g:o,local:h}});return r[0].atoms.forEach(o=>{n[o.id]=e.length,e.push({id:o.id,el:o.el})}),{parsed:t,graphs:r,ids:e,index:n}}var Tl=i=>(Qi[i]||Qi.C).r;function Es(i,t,e){let n=Tl(i)+Tl(t);return e>=3?n*.78:e>=2?n*.87:e>1?n*.92:n}var eg={4:109.5,3:120,2:180,1:180};function ng(i,t,e){let n=Array.from({length:e},()=>[]),s=i.bonds.map(l=>{let E=t[l.a],y=t[l.b];return n[E].push(y),n[y].push(E),{i:E,j:y,order:l.order}}),r=[];i.atoms.forEach(l=>{r[t[l.id]]=l});let o=[],a=new Set,c=new Set,h=(l,E)=>l<E?l*1e4+E:E*1e4+l;s.forEach(l=>{o.push([l.i,l.j,Es(r[l.i].el,r[l.j].el,l.order),1]),a.add(h(l.i,l.j))});let d=[],u=[];for(let l=0;l<e;l++){let E=r[l],y=n[l],v=s.filter(b=>b.i===l||b.j===l).reduce((b,U)=>b+U.order,0);d[l]=E.el==="H"?0:El(E.el,E.charge,v,0);let D=s.some(b=>(b.i===l||b.j===l)&&b.order>1),I=y.length+d[l];D&&d[l]>0&&y.length<=2&&(I=Math.min(I,3)),D&&y.length===3&&(I=3);let P=s.some(b=>(b.i===l||b.j===l)&&b.order>=3),N=s.filter(b=>(b.i===l||b.j===l)&&b.order===2).length,w=y.length===2&&d[l]===0&&(P||N===2)?180:eg[Math.max(2,Math.min(4,I))]||109.5;for(let b=0;b<y.length;b++)for(let U=b+1;U<y.length;U++){let V=y[b],H=y[U],W=o.find(ut=>h(ut[0],ut[1])===h(l,V)),$=o.find(ut=>h(ut[0],ut[1])===h(l,H)),G=W[2],rt=$[2],q=w*Math.PI/180;o.push([V,H,Math.sqrt(G*G+rt*rt-2*G*rt*Math.cos(q)),.5]),c.add(h(V,H))}y.length===3&&I===3&&u.push([l,y[0],y[1],y[2]])}let f=[];s.filter(l=>l.order>1&&l.order<3).forEach(l=>{n[l.i].filter(E=>E!==l.j).forEach(E=>n[l.j].filter(y=>y!==l.i).forEach(y=>{let v=Es(r[l.i].el,r[l.j].el,l.order),D=Es(r[l.i].el,r[E].el,1),I=Es(r[l.j].el,r[y].el,1),P=[D*Math.cos(2.094),D*Math.sin(2.094)],N=[v+I*Math.cos(1.047),I*Math.sin(1.047)],w=[v+I*Math.cos(-1.047),-I*Math.sin(1.047)];f.push([E,y,Math.hypot(N[0]-P[0],N[1]-P[1]),Math.hypot(w[0]-P[0],w[1]-P[1]),l.i,l.j]),c.add(h(E,y))}))});let p=[];i.atoms.forEach(l=>{if(!l.chiral||l.id[0]!=="m")return;let E=t[l.id],y=l.nb.filter(v=>v>=0).map(v=>t[i.local[v]]);if(l.h===1){let v=t["h"+l.id.slice(1)+"_0"];y.splice(l.hasPrev?1:0,0,v)}y.length===4&&p.push([E,y,l.chiral==="@"?-1:1])});let g=[],x=0,m=new Array(e).fill(-1);for(let l=0;l<e;l++){if(m[l]>=0)continue;let E=[l];for(m[l]=x;E.length;){let y=E.pop();n[y].forEach(v=>{m[v]<0&&(m[v]=x,E.push(v))})}x++}return{bonds:s,nbr:n,dist:o,bonded:a,near:c,key:h,lp:d,planar:u,dihedral:f,chiral:p,frag:m,nfrag:x,el:r}}function ig(i,t){let[e,n,s,r]=t.map(o=>i[o]);return tt.dot(tt.sub(n,e),tt.cross(tt.sub(s,e),tt.sub(r,e)))}function Mr(i,t,e,n,s={}){let{key:r,bonded:o,near:a}=t,c=h=>t.el[h].el!=="H";for(let h=0;h<n;h++){t.dist.forEach(([u,f,p,g])=>{let x=tt.sub(i[f],i[u]),m=tt.len(x)||1e-6,l=(m-p)/m*.5*g*.5;i[u]=tt.add(i[u],tt.mul(x,l)),i[f]=tt.sub(i[f],tt.mul(x,l))}),t.dihedral.forEach(([u,f,p,g,x,m])=>{let l=tt.cross(tt.sub(i[x],i[u]),tt.sub(i[m],i[x])),E=tt.cross(tt.sub(i[m],i[x]),tt.sub(i[f],i[m])),y=tt.dot(l,E)>=0?p:g,v=tt.sub(i[f],i[u]),D=tt.len(v)||1e-6,I=(D-y)/D*.25;i[u]=tt.add(i[u],tt.mul(v,I)),i[f]=tt.sub(i[f],tt.mul(v,I))}),t.planar.forEach(([u,f,p,g])=>{let x=tt.norm(tt.cross(tt.sub(i[p],i[f]),tt.sub(i[g],i[f]))),m=tt.dot(tt.sub(i[u],i[f]),x);i[u]=tt.sub(i[u],tt.mul(x,m*.6))}),s.chiral!==!1&&t.chiral.forEach(([u,f,p])=>{let[g,x,m,l]=f.map(W=>i[W]),E=tt.sub(x,g),y=tt.sub(m,g),v=tt.sub(l,g),D=tt.dot(E,tt.cross(y,v)),I=p*2.2;if(D*p>=2)return;let P=tt.cross(y,v),N=tt.cross(v,E),w=tt.cross(E,y),U=[tt.mul(tt.add(tt.add(P,N),w),-1),P,N,w],V=U.reduce((W,$)=>W+tt.dot($,$),0)||1e-6,H=(D-I)/V*.5;f.forEach((W,$)=>{i[W]=tt.sub(i[W],tt.mul(U[$],H))})});for(let u=0;u<e;u++)for(let f=u+1;f<e;f++){let p=r(u,f);if(o.has(p)||a.has(p))continue;let x=t.frag[u]!==t.frag[f]?c(u)&&c(f)?3.2:2.6:c(u)&&c(f)?2.5:c(u)||c(f)?2.1:1.8,m=tt.sub(i[f],i[u]),l=tt.len(m);if(l>=x)continue;let E=(l-x)/(l||1e-6)*.25;i[u]=tt.add(i[u],tt.mul(m,E)),i[f]=tt.sub(i[f],tt.mul(m,E))}(s.keepApart||[]).forEach(([u,f,p])=>{let g=tt.sub(i[f],i[u]),x=tt.len(g)||1e-6;if(x>=p)return;let m=(x-p)/x*.3;i[u]=tt.add(i[u],tt.mul(g,m)),i[f]=tt.sub(i[f],tt.mul(g,m))})}return i}function sg(i,t){let e=0;return t.dist.forEach(([n,s,r,o])=>{let a=tt.len(tt.sub(i[s],i[n]));e+=o*(a-r)**2}),e}function rg(i,t,e,n,s){let r=e[0];i[r]=n.slice();let o=new Set([r]),a=[r];for(;a.length;){let c=a.shift(),h=t.nbr[c].filter(l=>!o.has(l));if(!h.length)continue;let d=t.nbr[c].find(l=>o.has(l)&&l!==c),u=d!==void 0?tt.norm(tt.sub(i[c],i[d])):tt.norm([s()-.5,s()-.5,s()-.5]),f=Math.abs(u[2])<.9?[0,0,1]:[0,1,0],p=tt.norm(tt.cross(u,f)),g=tt.cross(u,p),x=s()*6.283,m=h.length;h.forEach((l,E)=>{let y=x+E*6.283/m,v=d!==void 0?.94:0,D=tt.norm(tt.add(tt.mul(u,d!==void 0?.334:1),tt.add(tt.mul(p,Math.cos(y)*(v||1)),tt.mul(g,Math.sin(y)*(v||1))))),I=t.bonds.find(P=>P.i===c&&P.j===l||P.j===c&&P.i===l);i[l]=tt.add(i[c],tt.mul(D,Es(t.el[c].el,t.el[l].el,I?I.order:1))),o.add(l),a.push(l)})}}function Va(i,t){let e=[0,0,0];return t.forEach(n=>{e[0]+=i[n][0],e[1]+=i[n][1],e[2]+=i[n][2]}),tt.mul(e,1/Math.max(1,t.length))}function og(i,t,e,n,s){let r=tt.cross(n,s),o=tt.len(r),a=tt.dot(n,s);if(o<1e-6){if(a>0)return;let d=tt.norm(tt.cross(n,Math.abs(n[0])<.9?[1,0,0]:[0,1,0]));t.forEach(u=>{let f=tt.sub(i[u],e),p=tt.sub(tt.mul(d,2*tt.dot(d,f)),f);i[u]=tt.add(e,p)});return}let c=tt.mul(r,1/o),h=Math.atan2(o,a);t.forEach(d=>{let u=tt.sub(i[d],e),f=tt.add(tt.add(tt.mul(u,Math.cos(h)),tt.mul(tt.cross(c,u),Math.sin(h))),tt.mul(c,tt.dot(c,u)*(1-Math.cos(h))));i[d]=tt.add(e,f)})}var Al=(i,t,e,n)=>{if(n!==void 0)return tt.norm(tt.sub(i[e],i[n]));let s=t.nbr[e];if(!s.length)return[1,0,0];let r=Va(i,s),o=tt.sub(i[e],r);return tt.len(o)<.2&&s.length>=2&&(o=tt.cross(tt.sub(i[s[0]],i[e]),tt.sub(i[s[1]],i[e]))),tt.norm(o)};function Cl(i){let t=tg(i.states),e=t.ids.length,n=Qm(e*7919+i.states.length),s=t.graphs.map(l=>ng(l,t.index,e)),r=i.arrows||[],o=l=>t.index["m"+l],a=Array.from({length:e},()=>[0,0,0]),c=s[0],h={};c.frag.forEach((l,E)=>(h[l]=h[l]||[]).push(E));let d=Object.keys(h).sort((l,E)=>h[E].length-h[l].length),u=null;for(let l=0;l<3;l++){let E=Array.from({length:e},()=>[0,0,0]);d.forEach((v,D)=>{let I=h[v].slice().sort((P,N)=>(c.el[P].el==="H")-(c.el[N].el==="H"));rg(E,c,I,[D*9,0,0],n)}),Mr(E,c,e,260);let y=sg(E,c);(!u||y<u.v)&&(u={v:y,Q:E})}a=u.Q;let f=new Set([d[0]]);for(let l=0;l<s.length-1&&f.size<d.length;l++)(r[l]||[]).forEach(E=>{if(!Array.isArray(E.to)||E.to.length!==2)return;let y=o(E.to[0]),v=o(E.to[1]);if(y===void 0||v===void 0)return;let D=String(c.frag[y]),I=String(c.frag[v]);if(D===I)return;let P=f.has(D)&&!f.has(I)?v:!f.has(D)&&f.has(I)?y:f.has(D)?null:v;if(P===null)return;let N=P===y?v:y,w=String(c.frag[P]),b=(r[l]||[]).find(rt=>Array.isArray(rt.from)&&rt.from.length===2&&(o(rt.from[0])===N||o(rt.from[1])===N)),U=b?o(b.from[0])===N?o(b.from[1]):o(b.from[0]):void 0,V=Al(a,c,N,U),H=tt.add(a[N],tt.mul(V,3.4)),W=h[w],$=Al(a,c,P);og(a,W,a[P],$,tt.mul(V,-1));let G=tt.sub(H,a[P]);W.forEach(rt=>{a[rt]=tt.add(a[rt],G)}),f.add(w)});d.forEach((l,E)=>{if(f.has(l))return;let y=Va(a,h[d[0]]),v=tt.add(y,[0,-5.5-E,2]),D=Va(a,h[l]),I=tt.sub(v,D);h[l].forEach(P=>{a[P]=tt.add(a[P],I)}),f.add(l)}),Mr(a,c,e,120);let p=[a.map(l=>l.slice())],g=[];for(let l=1;l<s.length;l++){let E=s[l],y=p[l-1].map(D=>D.slice()),v=[];s[l-1].bonds.forEach(D=>{!E.bonded.has(E.key(D.i,D.j))&&E.frag[D.i]!==E.frag[D.j]&&v.push([D.i,D.j,3.6])}),Mr(y,E,e,260,{chiral:!1,keepApart:v}),E.chiral.forEach(([D,I,P])=>{ig(y,I)*P<0&&g.push(`state ${l+1}: the motion gives the opposite configuration at atom ${t.ids[D].id.slice(1)} from the one written (check retention vs inversion)`)}),Mr(y,E,e,160,{keepApart:v}),p.push(y)}let x=[];p.forEach(l=>l.forEach((E,y)=>{t.ids[y].el!=="H"&&x.push(E)}));let m=x.reduce((l,E)=>tt.add(l,E),[0,0,0]).map(l=>l/x.length);return p.forEach(l=>l.forEach((E,y)=>{l[y]=tt.sub(E,m)})),{atoms:t.ids.map((l,E)=>({id:l.id,el:l.el,map:l.id[0]==="m"?+l.id.slice(1):0})),frames:p,states:s.map((l,E)=>({bonds:l.bonds.map(y=>({i:y.i,j:y.j,order:y.order})),charge:l.el.map(y=>y.charge||0),lp:l.lp,name:i.states[E].name||""})),warnings:g}}var ln=(i,t,e)=>Math.max(t,Math.min(e,i)),br=i=>(i=ln(i,0,1),i*i*(3-2*i));var ts=i=>String(i==null?"":i).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]),Rl={H:15922165,C:3817291,N:4025343,O:16726843,F:9429866,Cl:2274138,Br:10829870,I:9060272,S:15911244,P:16747562,B:16757920,Li:11566079,Na:11566079,K:10181887,Mg:8379519,Si:14203276,Se:16752954,Al:12560038,Fe:14706227,Zn:8224944},Ga=i=>i==="H"?.23:["Br","I","K","Na","S","P","Cl","Mg","Si","Se","Al","Fe","Zn","Li"].includes(i)?.46:.34,Wa=i=>i>0?i>1?i+"+":"+":i<0?i<-1?-i+"\u2212":"\u2212":"";function Il(i,t){t=t||{};let e=t.lesson;if(!e||!e.mechanism)throw new Error("no mechanism to play");let n=wl(e.mechanism);if(!n.ok)throw new Error("This lesson didn't pass the chemistry check: "+n.errors[0]);let s=Cl(e.mechanism),r=s.frames.length-1,o={};if(s.atoms.forEach((O,Y)=>{O.map&&(o[O.map]=Y)}),!document.getElementById("mbx-css")){let O=document.createElement("style");O.id="mbx-css",O.textContent=yr,document.head.appendChild(O)}let a=(e.steps||[]).filter(O=>O&&O.say);i.innerHTML=`<div class="mbx">
    <div class="mbx-stage"><canvas></canvas><div class="mbx-labels"></div>
      <div class="mbx-hud"><div class="mbx-chip"><small data-r="stepn">3D Tutor \xB7 auto-built</small><b data-r="stept">${ts(e.title||"Mechanism")}</b></div>
        <div class="mbx-chip mbx-energy"><small>Energy profile</small><svg viewBox="0 0 224 116"><line x1="14" y1="104" x2="214" y2="104" stroke="#3a3f58"/><line x1="14" y1="104" x2="14" y2="8" stroke="#3a3f58"/>
          <path data-r="ecurve" fill="none" stroke="#8fb2ff" stroke-width="2.2"/><g data-r="elabels"></g><circle data-r="edot" r="5.5" fill="#ffc040" stroke="#fff" stroke-width="1.5"/></svg></div></div>
      <div class="mbx-meters"><div class="mbx-chip"><small>Now</small><b data-r="statenow" style="font-size:13.5px">\u2014</b></div></div>
      <div class="mbx-badge" data-r="badge">Auto-built from your note \xB7 check against your lecture</div></div>
    <div class="mbx-card"><div class="mbx-cap" data-r="cap"></div>
      <div class="mbx-quiz" data-r="quiz" hidden><button data-r="revealbtn">Tap to reveal</button><div class="mbx-reveal" data-r="reveal" hidden></div></div>
      <div class="mbx-ctl"><button class="mbx-play" data-r="play">\u25B6 Start the lesson</button><button data-r="prev" aria-label="Previous step">\u25C0</button><button data-r="next" aria-label="Next step">\u25B6</button>
        <span class="sp"></span><button data-r="slow">Slow motion</button><button data-r="mute" aria-label="Mute">\u{1F50A}</button></div>
      <div class="mbx-chaps" data-r="chaps" style="margin-top:10px"></div></div>
    <div class="mbx-card"><h4>The mechanism, state by state</h4><div class="mbx-chaps" data-r="states"></div>
      <input type="range" data-r="scrub" min="0" max="${r*1e3}" value="0" style="width:100%;margin-top:10px" aria-label="Run the reaction yourself">
      <div style="font-size:12px;color:var(--dim,#9aa0b4)">Drag to run the reaction yourself.</div></div>
    <div class="mbx-card"><h4>From your note</h4><ol class="mbx-lines" data-r="lines"></ol>
      <div style="margin-top:10px"><button data-r="flag" style="font:inherit;font-size:12.5px;border:1px solid var(--line,#232739);background:transparent;color:var(--dim,#9aa0b4);border-radius:9px;padding:6px 10px;cursor:pointer">Something looks wrong?</button></div></div>
  </div>`;let c={};i.querySelectorAll("[data-r]").forEach(O=>c[O.dataset.r]=O);let h=i.querySelector(".mbx-stage"),d=h.querySelector("canvas"),u=h.querySelector(".mbx-labels"),f=matchMedia("(prefers-reduced-motion: reduce)"),p=new ki({canvas:d,antialias:!0,alpha:!0});p.setPixelRatio(Math.min(2,window.devicePixelRatio||1)),p.outputColorSpace=De,p.toneMapping=vs,p.toneMappingExposure=1.05;let g=new Gn,x=new Vn(p);g.environment=x.fromScene(new Ki,.04).texture,g.environmentIntensity=.75;let m=new Re(34,1,.1,300);g.add(new qi(16777215,2633796,.8));let l=new Xn(16777215,1.8);l.position.set(-4,8,9),g.add(l);let E=new Xn(9417471,1.2);E.position.set(6,2,-8),g.add(E);let y=new Vi(1,32,22),v=new li(1,1,1,14,1),D=new L(0,1,0),I=s.atoms.map(O=>{let Y=new Yt(y,new mn({color:Rl[O.el]||13421772,roughness:.3,clearcoat:.6,clearcoatRoughness:.2,emissive:16756736,emissiveIntensity:0}));return Y.scale.setScalar(Ga(O.el)),g.add(Y),Y}),P={};s.states.forEach((O,Y)=>O.bonds.forEach(et=>{let pt=Math.min(et.i,et.j)+"-"+Math.max(et.i,et.j);(P[pt]=P[pt]||{i:Math.min(et.i,et.j),j:Math.max(et.i,et.j),order:[]}).order[Y]=et.order}));let N=new ke({color:16760896,transparent:!0}),w=Object.values(P).map(O=>{for(let Y=0;Y<=r;Y++)O.order[Y]=O.order[Y]||0;return O.sticks=[0,1,2].map(()=>[O.i,O.j].map(Y=>{let et=new Yt(v,new mn({color:Rl[s.atoms[Y].el]||13421772,roughness:.35,clearcoat:.4}));return g.add(et),et})),O.dash=[0,1,2,3,4].map(()=>{let Y=new Yt(v,N);return g.add(Y),Y}),O}),b=new L;function U(O,Y,et,pt){b.subVectors(et,Y);let Pt=b.length();O.visible=!0,O.position.addVectors(Y,et).multiplyScalar(.5),O.quaternion.setFromUnitVectors(D,b.normalize()),O.scale.set(pt,Pt,pt)}let V=new ke({color:16760896,transparent:!0}),H=[0,1,2,3].map(()=>{let O=new Yt(new He,V),Y=new Yt(new Hi(.15,.4,14),V),et=new Yt(y,new ke({color:16777215})),pt=new Yt(y,et.material);et.scale.setScalar(.08),pt.scale.setScalar(.08);let Pt=new $e;return Pt.add(O,Y,et,pt),g.add(Pt),{g:Pt,tube:O,head:Y,e1:et,e2:pt}}),W=[0,1,2,3].map(()=>{let O=new Yt(y,new mn({color:16760896,transparent:!0,opacity:.35,depthWrite:!1,emissive:16760896,emissiveIntensity:.3}));return O.scale.set(.2,.2,.42),g.add(O),O}),$=s.atoms.map(()=>new L);function G(O){let Y=Math.min(r-1,Math.floor(O)),et=br(O-Y),pt=s.frames[Y],Pt=s.frames[Math.min(r,Y+1)];return $.forEach((Vt,wt)=>Vt.set(pt[wt][0]+(Pt[wt][0]-pt[wt][0])*et,pt[wt][1]+(Pt[wt][1]-pt[wt][1])*et,pt[wt][2]+(Pt[wt][2]-pt[wt][2])*et)),{k:Y,u:et}}function rt(O,Y){let et=new L().subVectors(Y[O.j],Y[O.i]).normalize(),pt=w.find(wt=>wt!==O&&(wt.i===O.i||wt.j===O.i)),Pt=pt?new L().subVectors(Y[pt.i===O.i?pt.j:pt.i],Y[O.i]):new L(0,0,1),Vt=new L().crossVectors(et,Pt);return Vt.lengthSq()<1e-4&&(Vt=new L().crossVectors(et,new L(0,1,0))),new L().crossVectors(Vt.normalize(),et).normalize()}function q(O){let{k:Y,u:et}=G(O);return I.forEach((pt,Pt)=>pt.position.copy($[Pt])),w.forEach(pt=>{let Pt=pt.order[Y],Vt=pt.order[Math.min(r,Y+1)],wt=Pt+(Vt-Pt)*et,le=Math.abs(Pt-Vt)>.01&&et>.02&&et<.98,Xt=le?Math.floor(Math.min(Pt,Vt)+.01):Math.round(Pt+(Vt-Pt)*Math.round(et)),ee=$[pt.i],he=$[pt.j],Ne=ee.clone().lerp(he,.5),S=Xt>1||le?rt(pt,$):null,_=Xt===3?.16:.12;pt.sticks.forEach((C,z)=>C.forEach((Z,st)=>{if(z>=Math.max(1,Xt)||Xt===0){Z.visible=!1;return}let it=Xt===1?0:Xt===2?z?_:-_:(z-1)*_*1.4,bt=S?S.clone().multiplyScalar(it):new L;U(Z,(st?Ne:ee).clone().add(bt),(st?he:Ne).clone().add(bt),Xt>1?.06:.1)}));let A=le&&Math.abs(Pt-Vt)>.01,T=S&&Xt>=1?S.clone().multiplyScalar(.16):new L;pt.dash.forEach((C,z)=>{if(!A){C.visible=!1;return}U(C,ee.clone().lerp(he,(z+.15)/5).add(T),ee.clone().lerp(he,(z+.65)/5).add(T),.065)})}),N.opacity=.9,{k:Y,u:et}}function ut(O,Y,et){return new Wn(O,O.clone().lerp(Y,.5).add(et),Y)}function Mt(O,Y,et){let pt=et?(e.mechanism.arrows||[])[O]||[]:[],Pt=0,Vt=new L;$.forEach(wt=>Vt.add(wt)),Vt.multiplyScalar(1/$.length),H.forEach((wt,le)=>{let Xt=pt[le],ee=Xt&&Y<.6?ln((.6-Y)/.15,0,1):0;if(wt.g.visible=ee>.01,!wt.g.visible)return;let he=Z=>$[o[Z]];if(Xt.from.some(Z=>o[Z]===void 0)||Xt.to.some(Z=>o[Z]===void 0)){wt.g.visible=!1;return}let Ne=Xt.to.length===2?he(Xt.to[0]).clone().lerp(he(Xt.to[1]),.5):he(Xt.to[0]).clone().add(new L(0,Ga(s.atoms[o[Xt.to[0]]].el)+.15,0)),S;if(Xt.from.length===1){let Z=he(Xt.from[0]),st=Ne.clone().sub(Z).normalize();if(S=Z.clone().addScaledVector(st,.55),Pt<W.length){let it=W[Pt++];it.visible=!0,it.position.copy(Z).addScaledVector(st,.45),it.quaternion.setFromUnitVectors(new L(0,0,1),st),it.material.opacity=.35*ee}}else S=he(Xt.from[0]).clone().lerp(he(Xt.from[1]),.5);let _=Ne.clone().sub(S),A=S.clone().lerp(Ne,.5).sub(Vt),T=new L().crossVectors(_,new L(0,0,1));T.dot(A)<0&&T.negate(),T.lengthSq()<1e-4&&T.set(0,1,0),T.normalize().multiplyScalar(Math.max(.7,_.length()*.45)).add(new L(0,.35,0));let C=ut(S,Ne,T);wt.tube.geometry.dispose(),wt.tube.geometry=new Gi(C,36,.045,8,!1),wt.head.position.copy(C.getPoint(1)),wt.head.quaternion.setFromUnitVectors(D,C.getTangent(1)),V.opacity=ee;let z=performance.now()/1300%1;wt.e1.position.copy(C.getPoint(z)).add(new L(0,.07,0)),wt.e2.position.copy(C.getPoint(z)).add(new L(0,-.07,0))}),W.slice(Pt).forEach(wt=>wt.visible=!1)}let Ct=e.mechanism.states.map(O=>typeof O.energy=="number"?ln(O.energy,-1,1):0),Gt=(e.mechanism.barriers||[]).map(O=>ln(+O||.6,.05,1.2)),se=O=>{var wt;let Y=Math.min(r-1,Math.floor(O)),et=O-Y,pt=Ct[Y],Pt=Ct[Y+1],Vt=Math.max(pt,Pt)+((wt=Gt[Y])!=null?wt:.6)*.6;return et<.5?pt+(Vt-pt)*br(et*2):Vt+(Pt-Vt)*br((et-.5)*2)},J=Math.min(...Ct)-.1,at=Math.max(...Ct.map((O,Y)=>{var et;return Y<r?Math.max(O,Ct[Y+1])+((et=Gt[Y])!=null?et:.6)*.6:O}))+.05,Rt=O=>16+O/r*192,mt=O=>100-(O-J)/(at-J||1)*88;{let O="";for(let Y=0;Y<=120;Y++){let et=Y/120*r;O+=(Y?"L":"M")+Rt(et).toFixed(1)+" "+mt(se(et)).toFixed(1)}c.ecurve.setAttribute("d",O),c.elabels.innerHTML=Ct.map((Y,et)=>`<text x="${Rt(et).toFixed(1)}" y="${Math.min(113,mt(Y)+11).toFixed(1)}" font-size="8" text-anchor="middle" fill="#6b7086">${et+1}</text>`).join("")}let St={t:new L,d:14,yaw:-40,pitch:25},At={t:new L,d:12,yaw:15,pitch:14},Ft={yaw:0,pitch:0,z:1},ae=2,Dt=0;function te(){let O=h.clientWidth,Y=h.clientHeight;!O||!Y||(p.setSize(O,Y,!1),m.aspect=O/Y,m.updateProjectionMatrix())}function B(O,Y){let et=[];if(Y.forEach(Vt=>O.forEach(wt=>et.push(s.frames[Vt][wt]))),!et.length)return;let pt=et.reduce((Vt,wt)=>[Vt[0]+wt[0],Vt[1]+wt[1],Vt[2]+wt[2]],[0,0,0]).map(Vt=>Vt/et.length),Pt=1.5;et.forEach(Vt=>{Pt=Math.max(Pt,Math.hypot(Vt[0]-pt[0],Vt[1]-pt[1],Vt[2]-pt[2]))}),At.t.set(pt[0],pt[1],pt[2]),At.d=(Pt+1.6)/Math.tan(di.degToRad(17))*(m.aspect<1?1.35:.95)}function we(O){Ft={yaw:0,pitch:0,z:1};let Y=s.atoms.map((et,pt)=>pt).filter(et=>s.atoms[et].el!=="H");if(O.kind==="step"){let et=new Set,pt=s.states[O.k].bonds,Pt=s.states[O.k+1].bonds,Vt=ee=>Math.min(ee.i,ee.j)+"-"+Math.max(ee.i,ee.j),wt=new Map(pt.map(ee=>[Vt(ee),ee.order])),le=new Map(Pt.map(ee=>[Vt(ee),ee.order]));new Set([...wt.keys(),...le.keys()]).forEach(ee=>{(wt.get(ee)||0)!==(le.get(ee)||0)&&ee.split("-").forEach(he=>et.add(+he))});let Xt=new Set(et);et.forEach(ee=>w.forEach(he=>{he.i===ee&&Xt.add(he.j),he.j===ee&&Xt.add(he.i)})),B([...Xt].filter(ee=>s.atoms[ee].el!=="H"||et.has(ee)),[O.k,O.k+1]),At.yaw=20*(O.k%2?-1:1),At.pitch=16,ae=0}else O.kind==="state"?(B(Y,[O.s]),At.yaw=-15,At.pitch=20,ae=4):(B(Y,s.frames.map((et,pt)=>pt)),At.yaw=15,At.pitch=14,ae=3)}function Kt(O){let Y=f.matches?1:1-Math.exp(-O/.7);St.t.lerp(At.t,Y),St.d+=(At.d-St.d)*Y,St.yaw+=(At.yaw-St.yaw)*Y,St.pitch+=(At.pitch-St.pitch)*Y,Dt+=O,f.matches||(At.yaw+=ae*O);let et=di.degToRad(St.yaw+Ft.yaw+Math.sin(Dt*.2)*2.5),pt=di.degToRad(ln(St.pitch+Ft.pitch,-80,80)),Pt=St.d/Ft.z;m.position.set(St.t.x+Math.sin(et)*Math.cos(pt)*Pt,St.t.y+Math.sin(pt)*Pt,St.t.z+Math.cos(et)*Math.cos(pt)*Pt),m.lookAt(St.t)}let $t=!1,Ut=0,ce=0,It=0;h.addEventListener("pointerdown",O=>{$t=!0,Ut=O.clientX,ce=O.clientY;try{h.setPointerCapture(O.pointerId)}catch{}}),h.addEventListener("pointermove",O=>{$t&&(Ft.yaw-=(O.clientX-Ut)*.35,Ft.pitch=ln(Ft.pitch+(O.clientY-ce)*.3,-70,70),Ut=O.clientX,ce=O.clientY)}),h.addEventListener("pointerup",()=>{$t=!1}),h.addEventListener("pointercancel",()=>{$t=!1}),h.addEventListener("wheel",O=>{O.preventDefault(),Ft.z=ln(Ft.z*(1-O.deltaY*.001),.4,3)},{passive:!1}),h.addEventListener("touchmove",O=>{if(O.touches.length===2){let Y=Math.hypot(O.touches[0].clientX-O.touches[1].clientX,O.touches[0].clientY-O.touches[1].clientY);It&&(Ft.z=ln(Ft.z*Y/It,.4,3)),It=Y}},{passive:!0}),h.addEventListener("touchend",()=>{It=0});let R={};function M(O,Y){let et=document.createElement("div");return et.className=O,et.innerHTML=Y,u.appendChild(et),et}function k(O,Y,et=0){let pt=Y.clone().project(m);O.style.transform=`translate(${((pt.x+1)/2*h.clientWidth).toFixed(1)}px, ${((1-pt.y)/2*h.clientHeight+et).toFixed(1)}px)`,O.hidden=pt.z>1}function j(O,Y,et){s.atoms.forEach((wt,le)=>{let Xt=s.states[O].charge[le],ee=s.states[Math.min(r,O+1)].charge[le],he="q"+le,Ne=Xt===ee||Y<.3?Wa(Xt):Y>.7?Wa(ee):"\u03B4"+(Xt+ee>0||ee>Xt?"+":"\u2212");if(!Ne){R[he]&&(R[he].style.opacity=0);return}R[he]=R[he]||M("mbx-q",""),R[he].textContent=Ne,R[he].style.opacity=1,k(R[he],$[le].clone().add(new L(0,Ga(wt.el)+.3,.1)))});let pt=e.names||{},Pt=(et.focus||[]).filter(wt=>o[wt]!==void 0);Object.keys(R).filter(wt=>wt[0]==="f").forEach(wt=>R[wt].style.opacity=0),Pt.forEach(wt=>{let le="f"+wt;R[le]=R[le]||M("mbx-tag",""),R[le].innerHTML=ts(pt[wt]||s.atoms[o[wt]].el),R[le].style.opacity=1,k(R[le],$[o[wt]],30)});let Vt=new Set(Pt.map(wt=>o[wt]));I.forEach((wt,le)=>wt.material.emissiveIntensity=Vt.has(le)?.2+.1*Math.sin(performance.now()/250):0)}let nt=0,K=!1,lt=O=>String(O||"").split(/(?<=[.!?])\s+/).filter(Boolean);function dt(O,Y){c.cap.innerHTML=lt(O).map((et,pt)=>`<span class="${pt===Y?"on":""}">${ts(et)}</span>`).join(" ")}function vt(){try{t.speak?t.speak(null):window.speechSynthesis&&speechSynthesis.cancel()}catch{}}function Zt(O,Y){try{let et=new SpeechSynthesisUtterance(O);et.lang="en-GB",et.onend=Y,et.onerror=Y,speechSynthesis.speak(et)}catch{Y()}}function ot(O,Y){let et=++nt,pt=lt(O);vt();let Pt=0,Vt=()=>{if(et!==nt)return;if(Pt>=pt.length)return Y&&Y();dt(O,Pt);let wt=pt[Pt++],le=!1,Xt=()=>{le||(le=!0,et===nt&&setTimeout(Vt,120))};if(K)return setTimeout(Xt,900+wt.length*60);setTimeout(Xt,4e3+wt.length*140),t.speak?t.speak(wt,Xt):Zt(wt,Xt)};Vt()}let ht=0,Tt=null,Bt=1,ct=-1,Wt=!1,Nt=0,Et=a[0]||{kind:"overview"},F=!1;function ft(O){return O.kind==="step"?{from:O.k,to:O.k+1,dur:4.5,loop:!0,hold:1.4}:O.kind==="state"?{from:O.s,to:O.s,dur:1}:{from:0,to:r,dur:3.2*r+1,loop:!0,hold:1.5}}let X=0;function Q(O){Tt=Object.assign({hold:0},O),Tt.pre=ht,X=-.8}function gt(O){if(!Tt||F)return;if(X+=O/Bt,X<0){ht=Tt.pre+(Tt.from-Tt.pre)*br(1+X/.8);return}let Y=Tt.dur+Tt.hold+(Tt.loop?.6:0),et=Tt.loop?X%Y:X;ht=Tt.from+(Tt.to-Tt.from)*ln(et/Tt.dur,0,1)}function xt(){c.stepn.textContent=`Step ${ct+1} of ${a.length} \xB7 auto-built`,c.stept.textContent=Et.title||(Et.kind==="step"?`Step ${Et.k+1}`:Et.kind==="state"?s.states[Et.s].name||"State "+(Et.s+1):Et.kind==="quiz"?"Check yourself":e.title||"Mechanism"),c.chaps.querySelectorAll("button").forEach((Y,et)=>Y.classList.toggle("on",et===ct));let O=c.chaps.querySelector("button.on");O&&c.chaps.scrollTo({left:O.offsetLeft-40,behavior:"smooth"})}function zt(O){if(clearTimeout(Nt),ct=ln(O,0,a.length-1),Et=a[ct],xt(),we(Et),Q(ft(Et)),c.quiz.hidden=Et.kind!=="quiz",c.reveal.hidden=!0,t.warm){let Y=[];[ct,ct+1].forEach(et=>{a[et]&&Y.push(...lt(a[et].say))});try{t.warm(Y)}catch{}}Wt?ot(Et.say,()=>{Wt&&ct===O&&Et.kind!=="quiz"&&ct+1<a.length?Nt=setTimeout(()=>zt(ct+1),900):ct+1>=a.length&&ue(!1)}):dt(Et.say,-1)}function ue(O){Wt=O,c.play.textContent=O?"\u275A\u275A Pause":ct<0?"\u25B6 Start the lesson":"\u25B6 Resume",O?zt(ct<0?0:ct):(nt++,vt())}c.play.onclick=()=>ue(!Wt),c.next.onclick=()=>zt(ct+1),c.prev.onclick=()=>zt(ct-1),c.mute.onclick=()=>{K=!K,c.mute.textContent=K?"\u{1F507}":"\u{1F50A}",Wt&&zt(ct)},c.slow.onclick=()=>{Bt=Bt>1?1:3,c.slow.textContent=Bt>1?"Normal speed":"Slow motion"},c.revealbtn.onclick=()=>{c.reveal.hidden=!1,c.reveal.textContent=Et.answer||"",Wt&&Et.answer&&ot(Et.answer,()=>{})},c.chaps.innerHTML=a.map((O,Y)=>`<button>${Y+1}. ${ts(O.title||(O.kind==="step"?"Step "+(O.k+1):O.kind==="state"?s.states[O.s].name||"State":O.kind==="quiz"?"Check yourself":O.kind==="summary"?"Summary":"Overview"))}</button>`).join(""),c.chaps.querySelectorAll("button").forEach((O,Y)=>O.onclick=()=>zt(Y)),c.states.innerHTML=s.states.map((O,Y)=>`<button data-s="${Y}">${Y+1}. ${ts(O.name||"State "+(Y+1))}</button>`).join(""),c.states.querySelectorAll("button").forEach(O=>O.onclick=()=>{F=!1,Q({from:+O.dataset.s,to:+O.dataset.s,dur:1}),B(s.atoms.map((Y,et)=>et).filter(Y=>s.atoms[Y].el!=="H"),[+O.dataset.s])}),c.scrub.oninput=()=>{F=!0,ht=+c.scrub.value/1e3},c.scrub.onchange=()=>{setTimeout(()=>{F=!1,Q({from:ht,to:ht,dur:1})},50)},c.lines.innerHTML=(e.lines||[]).map(O=>`<li>${ts(O)}</li>`).join("")||"<li>\u2014</li>",c.flag.onclick=()=>{c.flag.disabled=!0,c.flag.textContent="Thanks \u2014 we'll check this lesson.";try{t.onFlag&&t.onFlag()}catch{}};let ve=0,ne=0,Te=!1,ze=new ResizeObserver(te);ze.observe(h);function Me(O){if(Te)return;if(!i.isConnected){Xe();return}ne=requestAnimationFrame(Me);let Y=ve?Math.min(.1,(O-ve)/1e3):.016;ve=O,f.matches?Tt&&(ht=Tt.to):gt(Y),ht=ln(ht,0,r);let{k:et,u:pt}=q(ht);Mt(et,pt,Et.kind==="step"?Et.k===et:Et.kind==="overview"),c.edot.setAttribute("cx",Rt(ht).toFixed(1)),c.edot.setAttribute("cy",mt(se(ht)).toFixed(1)),F||(c.scrub.value=String(Math.round(ht*1e3)));let Pt=Math.round(ht);c.statenow.textContent=Math.abs(ht-Pt)<.08?s.states[Pt].name||"State "+(Pt+1):`${et+1} \u2192 ${et+2}`,c.states.querySelectorAll("button").forEach((Vt,wt)=>Vt.classList.toggle("on",Math.abs(ht-wt)<.08)),Kt(Y),j(et,pt,Et),p.render(g,m)}function Xe(){if(!Te){Te=!0,cancelAnimationFrame(ne),nt++,vt(),clearTimeout(Nt),ze.disconnect(),g.traverse(O=>{O.material&&O.material.dispose&&O.material.dispose(),O.geometry&&O.geometry!==y&&O.geometry!==v&&O.geometry.dispose()}),y.dispose(),v.dispose();try{g.environment.dispose(),x.dispose()}catch{}p.dispose();try{p.forceContextLoss()}catch{}}}return te(),we(Et),St.t.copy(At.t),St.d=At.d*1.4,Q(ft({kind:"overview"})),dt("Press \u201CStart the lesson\u201D. Drag to turn the molecules, or drag the slider to run the reaction yourself.",-1),ne=requestAnimationFrame(Me),{destroy:Xe,go:zt,setPlay:ue,_T:()=>ht,_set:O=>{F=!0,ht=O},_settle:()=>{St.t.copy(At.t),St.d=At.d,St.yaw=At.yaw,St.pitch=At.pitch},warnings:s.warnings}}window.MBMech={mount:bl,mountAuto:Il,templates:Object.keys(za),version:"1.1.0"};})();
