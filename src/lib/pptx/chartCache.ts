/** Replace a chart's cached categories and values so PowerPoint draws these series. */

export interface ChartSeries {
  name: string;
  values: number[];
  /** Number format written into the chart cache. Omit to keep the series format already in the template. */
  format?: string;
}

export interface ChartPlot {
  categories: string[];
  series: ChartSeries[];
}

function escapeText(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function num(value: number) {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.abs(value) >= 100 ? Math.round(value) : Math.round(value * 10000) / 10000;
  return String(rounded);
}

function strBody(values: string[]) {
  const pts = values.map((value, index) => `<c:pt idx="${index}"><c:v>${escapeText(value)}</c:v></c:pt>`).join('');
  return `<c:ptCount val="${values.length}"/>${pts}`;
}

function numBody(values: number[], format?: string) {
  const fmt = format ? `<c:formatCode>${escapeText(format)}</c:formatCode>` : '';
  const pts = values.map((value, index) => `<c:pt idx="${index}"><c:v>${num(value)}</c:v></c:pt>`).join('');
  return `${fmt}<c:ptCount val="${values.length}"/>${pts}`;
}

function rewriteTaggedSeries(xml: string, tag: string, categories: string[], series: ChartSeries[], dropExtras: boolean) {
  const serRe = new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`, 'g');
  const original = [...xml.matchAll(serRe)];
  const dataIndexes = original.map((match, index) => (match[0].includes('<c:val>') ? index : -1)).filter((index) => index >= 0);
  let out = xml;
  if (dropExtras) {
    for (let index = dataIndexes.length - 1; index >= series.length; index -= 1) {
      out = out.replace(original[dataIndexes[index]][0], '');
    }
  }
  const kept = [...out.matchAll(serRe)].filter((match) => match[0].includes('<c:val>'));
  kept.forEach((match, index) => {
    const spec = series[Math.min(index, series.length - 1)];
    const values = categories.map((_, point) => spec.values[point] ?? 0);
    const format = spec.format ?? match[0].match(/<c:formatCode>([^<]*)<\/c:formatCode>/)?.[1];
    let block = match[0];
    block = block.replace(/<c:tx>[\s\S]*?<\/c:tx>/, `<c:tx><c:v>${escapeText(spec.name)}</c:v></c:tx>`);
    block = block.replace(/<c:cat>[\s\S]*?<\/c:cat>/, `<c:cat><c:strLit>${strBody(categories)}</c:strLit></c:cat>`);
    block = block.replace(/<c:val>[\s\S]*?<\/c:val>/, `<c:val><c:numLit>${numBody(values, format)}</c:numLit></c:val>`);
    out = out.replace(match[0], block);
  });
  return out;
}

/**
 * Rewrite every data series in a chart part, including series PowerPoint has filtered out.
 * Extra template series are removed. Formulas are dropped so PowerPoint keeps this cache
 * instead of refreshing the template's example workbook.
 */
export function rewriteChart(xml: string, plot: ChartPlot): string {
  const categories = plot.categories.length ? plot.categories : ['Not in this review'];
  const series = plot.series.length ? plot.series : [{ name: 'Not in this review', values: [0], format: '#,##0' }];
  let out = rewriteTaggedSeries(xml, 'c:ser', categories, series, true);
  out = rewriteTaggedSeries(out, 'c15:ser', categories, series, false);
  return out;
}
