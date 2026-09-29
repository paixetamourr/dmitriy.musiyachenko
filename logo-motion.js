'use strict';
(()=>{
const outline="M24.275 12.2085C20.9557 1.26552 36.3378 -5.02364 41.6362 5.10972C45.1418 11.8152 54.7235 11.8599 58.2909 5.18728C63.6818 -4.89779 79.0069 1.53178 75.5875 12.444C73.325 19.6644 80.0684 26.4706 87.3091 24.2747C98.2522 20.9554 104.542 36.3379 94.4079 41.636C87.7022 45.1419 87.6587 54.7237 94.3318 58.2907C104.417 63.6815 97.9869 79.0062 87.0751 75.5874C79.8547 73.3249 73.0482 80.0681 75.2443 87.309C78.5635 98.2522 63.1797 104.542 57.8816 94.4078C54.3756 87.7024 44.794 87.6585 41.2269 94.3316C35.836 104.416 20.5128 97.9868 23.9318 87.0749C26.1946 79.8543 19.4497 73.0477 12.2086 75.2441C1.26568 78.5631 -5.02385 63.1796 5.1099 57.8815C11.8155 54.3756 11.8604 44.794 5.18744 41.2268C-4.89766 35.8359 1.5319 20.5118 12.4442 23.9315C19.6647 26.1941 26.4712 19.4494 24.275 12.2085ZM62.3365 35.2941C58.9718 35.2943 55.886 36.4846 53.4756 38.4665C51.6304 39.9835 48.2062 39.9835 46.361 38.4665C43.9506 36.4846 40.865 35.2941 37.5001 35.2941C29.7844 35.2941 23.5296 41.549 23.5296 49.2647C23.5296 56.9804 29.7844 63.2353 37.5001 63.2353C40.8648 63.2353 43.9507 62.045 46.361 60.0629C48.2063 58.5457 51.6303 58.5459 53.4756 60.0629C55.8859 62.045 58.9718 63.2353 62.3365 63.2353C70.0522 63.2353 76.3071 56.9804 76.3071 49.2647C76.3071 41.549 70.0522 35.2941 62.3365 35.2941Z";
const contours=outline.split(/(?<=Z)(?=M)/).map((d,index)=>{
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',d);
 const length=path.getTotalLength(),count=index===0?240:120;
 return Array.from({length:count},(_,i)=>{const p=path.getPointAtLength(length*i/count);return [p.x-50,50-p.y]});
});
// Sample both closed outlines on matching rays, then join them into a watertight ring.
const count=240;
function radial(points,angle){
 const dx=Math.cos(angle),dy=Math.sin(angle);let nearest=Infinity;
 for(let i=0;i<points.length;i++){
  const p=points[i],q=points[(i+1)%points.length],ex=q[0]-p[0],ey=q[1]-p[1];
  const den=dx*ey-dy*ex;if(Math.abs(den)<1e-8)continue;
  const t=(p[0]*ey-p[1]*ex)/den,u=(p[0]*dy-p[1]*dx)/den;
  if(t>0&&u>=0&&u<=1)nearest=Math.min(nearest,t);
 }
 return [dx*nearest,dy*nearest];
}
const rings=contours.map(points=>Array.from({length:count},(_,i)=>radial(points,i/count*Math.PI*2)));
const mesh=[];
function quad(a,b,c,d,normal,face){mesh.push({points:[a,b,c],normal,face},{points:[a,c,d],normal,face})}
for(let i=0;i<count;i++){
 const j=(i+1)%count;
 for(const side of [-1,1])quad([...rings[0][i],side*6],[...rings[0][j],side*6],[...rings[1][j],side*6],[...rings[1][i],side*6],[0,0,side],true);
 rings.forEach((ring,hole)=>{const p=ring[i],q=ring[j],dx=q[0]-p[0],dy=q[1]-p[1],length=Math.hypot(dx,dy),sign=hole?-1:1;
  quad([...p,-6],[...q,-6],[...q,6],[...p,6],[sign*dy/length,-sign*dx/length,0],false);
 });
}
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
class SpinningMark extends HTMLElement{
 connectedCallback(){
  this.canvas=document.createElement('canvas');this.append(this.canvas);this.ctx=this.canvas.getContext('2d');
  this.observer=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting});this.observer.observe(this);
  this.resize=new ResizeObserver(()=>this.size());this.resize.observe(this);this.size();
  const tick=t=>{if(this.visible&&!document.hidden&&!this.closest('.preloader.done')&&(!this.lastFrame||t-this.lastFrame>=32)){this.draw(reduced.matches?500:t);this.lastFrame=t}this.frame=requestAnimationFrame(tick)};this.frame=requestAnimationFrame(tick);
 }
 disconnectedCallback(){cancelAnimationFrame(this.frame);this.observer.disconnect();this.resize.disconnect()}
 size(){const w=this.clientWidth||115;this.canvas.width=this.canvas.height=Math.min(640,Math.round(w*2));this.pixels=this.ctx.createImageData(this.canvas.width,this.canvas.height);this.depth=new Float32Array(this.canvas.width*this.canvas.height);this.faceColors=new Uint8ClampedArray(this.canvas.width*this.canvas.height*3);this.draw(500)}
 draw(time){
  const w=this.canvas.width,data=this.pixels.data;data.fill(0);this.depth.fill(-Infinity);
  const a=time/1000*Math.PI*2/7.5,cy=Math.cos(a),sy=Math.sin(a),scale=w/120;
  const rotate=([x,y,z])=>[x*cy+z*sy,y,-x*sy+z*cy];
  // A depth buffer resolves each pixel, including both walls of the central opening.
  // Orthographic projection keeps the silhouette upright throughout the turn.
  const faceColors=this.faceColors;
  for(let y=0;y<w;y++)for(let x=0;x<w;x++){
   const u=x/w,v=y/w;
   const band=u*.8+v*.22+.055*Math.sin(v*7+a*.5)+Math.sin(a)*.16;
   const sheen=Math.pow((1+Math.sin(band*12))/2,3),iridescence=Math.sin(band*5+a*.3);
   const k=(y*w+x)*3;faceColors[k]=23+sheen*45+iridescence*7;faceColors[k+1]=46+sheen*51;faceColors[k+2]=206+sheen*32;
  }
  for(const triangle of mesh){
   const normal=rotate(triangle.normal);if(normal[2]<=0)continue;
   const ps=triangle.points.map(rotate).map(([x,y,z])=>[w/2+x*scale,w/2-y*scale,z]);
   const [p,q,r]=ps,den=(q[1]-r[1])*(p[0]-r[0])+(r[0]-q[0])*(p[1]-r[1]);if(Math.abs(den)<1e-8)continue;
   const minX=Math.max(0,Math.floor(Math.min(...ps.map(p=>p[0])))),maxX=Math.min(w-1,Math.ceil(Math.max(...ps.map(p=>p[0]))));
   const minY=Math.max(0,Math.floor(Math.min(...ps.map(p=>p[1])))),maxY=Math.min(w-1,Math.ceil(Math.max(...ps.map(p=>p[1]))));
   const light=.64+.36*Math.max(0,-normal[0]*.4+normal[1]*.4+normal[2]*.82);
   for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
    const px=x+.5,py=y+.5;
    const b0=((q[1]-r[1])*(px-r[0])+(r[0]-q[0])*(py-r[1]))/den;
    const b1=((r[1]-p[1])*(px-r[0])+(p[0]-r[0])*(py-r[1]))/den,b2=1-b0-b1;
    if(b0< -1e-6||b1< -1e-6||b2< -1e-6)continue;
    const z=b0*p[2]+b1*q[2]+b2*r[2],idx=y*w+x;if(z<=this.depth[idx])continue;
    this.depth[idx]=z;const k=idx*4,t=idx*3;
    data[k]=(triangle.face?faceColors[t]:25)*light;data[k+1]=(triangle.face?faceColors[t+1]:48)*light;data[k+2]=(triangle.face?faceColors[t+2]:214)*light;data[k+3]=255;
   }
  }
  this.ctx.putImageData(this.pixels,0,0);
 }
}
customElements.define('spinning-mark',SpinningMark);
})();
