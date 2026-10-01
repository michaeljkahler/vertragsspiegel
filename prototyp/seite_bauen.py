"""Setzt vertragsspiegel_daten.json in die Vorlage ein und schreibt vertragsspiegel.html."""
import pathlib
S = pathlib.Path(__file__).parent
t = (S / 'vertragsspiegel_template.html').read_text(encoding='utf8')
d = (S / 'vertragsspiegel_daten.json').read_text(encoding='utf8').replace('</', '<\\/')
(S / 'vertragsspiegel.html').write_text(t.replace('__DATEN__', d), encoding='utf8')
print('vertragsspiegel.html geschrieben')
