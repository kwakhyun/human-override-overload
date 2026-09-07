"""Shared recruitment PDF layout primitives; no page authoring on import."""
from pathlib import Path
from html import escape
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.utils import ImageReader
from PIL import Image, ImageOps
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/pdf/human-override-overload-recruitment-portfolio.pdf'
TMP=ROOT/'tmp/pdfs/ai-report-update'
TMP.mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(TTFont('KR','C:/Windows/Fonts/malgun.ttf'))
pdfmetrics.registerFont(TTFont('KRB','C:/Windows/Fonts/malgunbd.ttf'))
W,H=595.2756,841.8898
INK='#102932'; MUTED='#506B77'; CYAN='#007E94'; PALE='#EAF7FA'; LINE='#BED4DC'; PAPER='#F7FBFC'; DARK='#061D26'; PINK='#FFF0F3'
c=None

def begin_document():
 global c
 OUT.parent.mkdir(parents=True,exist_ok=True)
 c=canvas.Canvas(str(OUT),pagesize=(W,H),pageCompression=1)
 c.setTitle('HUMAN OVERRIDE: OVERLOAD | AI 협업 개발 포트폴리오 | 2026.09.07')
 c.setAuthor('kwakhyun');c.setSubject('Recruitment portfolio; verified release 75b6e0c')
 return c
def fill(v):c.setFillColor(colors.HexColor(v))
def text(x,y,s,size=10,color=INK,bold=False):
 fill(color);c.setFont('KRB' if bold else 'KR',size);c.drawString(x,H-y-size,s)
def para(x,y,w,s,size=10,color=INK,bold=False,limit=None):
 style=ParagraphStyle('p',fontName='KRB' if bold else 'KR',fontSize=size,leading=size*1.55,textColor=colors.HexColor(color),wordWrap='CJK')
 p=Paragraph(escape(s).replace('\n','<br/>'),style);_,h=p.wrap(w,900)
 if limit is not None:assert h<=limit,(s[:30],h,limit)
 p.drawOn(c,x,H-y-h);return h
def box(x,y,w,h,bg='white',border=LINE):
 fill('#FFFFFF' if bg=='white' else bg);c.setStrokeColor(colors.HexColor(border));c.roundRect(x,H-y-h,w,h,7,stroke=1,fill=1)
def card(x,y,w,h,label,title,body,bg='white'):
 box(x,y,w,h,bg);text(x+12,y+11,label,8,CYAN,True)
 th=para(x+12,y+29,w-24,title,12,INK,True)
 para(x+12,y+35+th,w-24,body,9.5,MUTED,limit=h-43-th)
def band(y,label,body,bg=PALE,h=66):
 box(40,y,515,h,bg);text(53,y+12,label,9,CYAN,True);para(145,y+12,397,body,9.5,MUTED,limit=h-21)
def shot(path,x,y,w,h,caption=None):
 im=Image.open(path).convert('RGB'); im=ImageOps.contain(im,(int(w*2.5),int(h*2.5)))
 fill(DARK);c.roundRect(x,H-y-h,w,h,5,stroke=0,fill=1)
 iw,ih=im.size;dw=min(w,iw/2.5);dh=min(h,ih/2.5)
 c.drawImage(ImageReader(im),x+(w-dw)/2,H-y-(h+dh)/2,dw,dh)
 if caption:para(x,y+h+6,w,caption,8,MUTED,limit=28)
def base(n,section,title,subtitle):
 fill(PAPER);c.rect(0,0,W,H,stroke=0,fill=1);fill(DARK);c.rect(0,H-31,W,31,stroke=0,fill=1)
 text(40,10,'HUMAN OVERRIDE: OVERLOAD  /  '+section,7,'#ACDDE6');text(512,10,f'{n:02d} / 09',7,'#ACDDE6')
 text(40,55,f'{n-1:02d}',10,CYAN,True);para(76,51,479,title,19,INK,True,limit=59);para(76,91,479,subtitle,9,MUTED,limit=44)
 c.setStrokeColor(colors.HexColor(LINE));c.line(40,43,555,43);text(40,806,'AI 협업 게임 개발 포트폴리오 · 2026.09.07 개정',7,MUTED);text(535,806,str(n),8,MUTED)
def end():c.showPage()
def steps(y,items,h=75):
 gap=8;w=(515-gap*(len(items)-1))/len(items)
 for i,(title,body) in enumerate(items):
  x=40+i*(w+gap);box(x,y,w,h);text(x+10,y+9,f'{i+1:02d}',8,CYAN,True);para(x+10,y+25,w-20,title,10,INK,True);para(x+10,y+44,w-20,body,8.5,MUTED,limit=h-48)

