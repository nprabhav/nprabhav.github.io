/* notes-data.js - the notes graph. Array order = curated reading thread.
   links[] are directed "feeds into" edges; the constellation and
   "adjacent in the graph" blocks are derived from them. */
/* plaintext profile for one-click copy into ATS / recruiter notes */
window.PROFILE = [
  'Prabhav Nalhe - Software Engineer (Distributed Systems & Reliability)',
  'Currently: Meta, Reliability Infrastructure (2024-present) · San Jose, CA',
  'Experience: ~6 years - Meta, Fidelity Investments, Quest Global',
  '',
  'Highlights:',
  '- Canonical service-dependency graph in Rust - ~20 GB/s stream fusion across six telemetry sources',
  '- Dependency protection program adopted by 1,000+ services',
  '- Fault-injection program protecting nine-figure revenue exposure',
  '- LLM agents explaining and classifying dependency risk at fleet scale',
  '',
  'Education: M.S. Computer Science, Stony Brook University (GPA 3.92) · B.E. CS, PICT Pune',
  'Publication: IEEE TASLP 2022 - Deep Learning Driven NL Text to SQL (arXiv:2208.04415)',
  '',
  'Web: https://prabhavnalhe.com · https://github.com/nprabhav · https://linkedin.com/in/nprabhav',
  'Email: nprabhav111@gmail.com · Résumé: https://prabhavnalhe.com/resume.pdf',
].join('\n');

window.NOTES_SERIES = {
  systems:  { label: 'Systems & reliability', cssVar: '--c-systems' },
  llm:      { label: 'LLM in production',     cssVar: '--c-llm' },
  research: { label: 'Earlier research',      cssVar: '--c-research' },
};
window.NOTES = [
  { slug: 'service-graph-lying', t: 'The Service Graph Is a Lower Bound', s: 'service graph',
    dek: 'The dependency graph you draw from RPC traffic is real but incomplete. The dependencies that take you down are the ones no edge shows.',
    tags: ['distributed systems', 'observability'], min: 5, series: 'systems',
    links: ['streaming-ingest-rust', 'slo-driven-risk', 'self-improving-platform'] },

  { slug: 'streaming-ingest-rust', t: 'Streaming Ingest in Rust', s: 'streaming ingest',
    dek: 'When you fuse many noisy event streams into one model, the hard problems are not throughput - they are identity and time.',
    tags: ['rust', 'streaming', 'distributed systems'], min: 7, series: 'systems',
    links: ['self-improving-platform', 'scaling-live-to-a-billion'] },

  { slug: 'self-improving-platform', t: 'Build the Substrate First', s: 'substrate first',
    dek: 'Most platforms that reason about a system are really stacks of queries against a model of that system. Platform quality is capped by the model underneath.',
    tags: ['platform', 'reliability', 'ml'], min: 6, series: 'systems',
    links: ['agent-harness-vs-rag'] },

  { slug: 'slo-driven-risk', t: 'SLO-Driven Risk', s: 'slo-driven risk',
    dek: 'Reliability effort gets spent on whatever feels scary in the room. Here is how to replace that gut feel with a number.',
    tags: ['slo/sli', 'reliability', 'risk'], min: 5, series: 'systems',
    links: ['closing-the-loop'] },

  { slug: 'scaling-live-to-a-billion', t: 'Scaling a Live Stream to a Billion Viewers', s: '1B live viewers',
    dek: 'A live broadcast turns one source into millions of simultaneous viewers in seconds. The hard part is not the video.',
    tags: ['distributed systems', 'streaming', 'scale'], min: 4, series: 'systems',
    links: ['slo-driven-risk'] },

  { slug: 'closing-the-loop', t: 'Closing the Loop', s: 'closing the loop',
    dek: 'When an LLM makes a judgment at scale, do not let it grade itself. Pair a cheap predictor with an expensive ground-truth engine.',
    tags: ['fault injection', 'ml labels', 'chaos eng'], min: 6, series: 'llm',
    links: ['llm-as-a-judge', 'evals-before-features'] },

  { slug: 'evals-before-features', t: 'Evals Before Features', s: 'evals first',
    dek: 'Before you wire an LLM into a real workflow, decide how you will know it is good enough - because the eval is the product spec.',
    tags: ['evals', 'llm'], min: 5, series: 'llm',
    links: ['llm-as-a-judge', 'text-to-sql-then-and-now'] },

  { slug: 'llm-as-a-judge', t: 'LLM as a Judge', s: 'llm judge',
    dek: 'A separate model can score outputs you cannot label by hand - but only if you treat it like a measuring instrument.',
    tags: ['evals', 'llm', 'quality gates'], min: 6, series: 'llm',
    links: ['cost-aware-llm-pipelines'] },

  { slug: 'cost-aware-llm-pipelines', t: 'Cost-Aware LLM Pipelines', s: 'cost-aware',
    dek: 'Most items in a large workload are easy, and a few are genuinely hard. The cheapest reliable pipeline routes compute by criticality.',
    tags: ['llm', 'cost', 'inference'], min: 6, series: 'llm',
    links: ['delivery-is-the-product'] },

  { slug: 'agent-harness-vs-rag', t: 'Agent Harness vs RAG', s: 'harness vs rag',
    dek: 'Two ways to feed a model context: retrieve fuzzy passages by similarity, or call purpose-built tools that return exact answers.',
    tags: ['llm agents', 'rag', 'tool calls'], min: 6, series: 'llm',
    links: ['apis-for-agents', 'cost-aware-llm-pipelines'] },

  { slug: 'apis-for-agents', t: 'Designing APIs for Agents, Not Humans', s: 'apis for agents',
    dek: 'When an LLM is the caller, the interface is the prompt. Typed responses, idempotent writes, granular composable calls.',
    tags: ['api design', 'llm agents'], min: 6, series: 'llm',
    links: ['delivery-is-the-product'] },

  { slug: 'delivery-is-the-product', t: 'Your Model Is Not the Product', s: 'delivery layer',
    dek: 'A correct model or a sharp analysis is necessary but not sufficient. What gets internal AI actually used is the last mile.',
    tags: ['llm', 'product'], min: 6, series: 'llm',
    links: [] },

  { slug: 'text-to-sql-then-and-now', t: 'Natural Language to SQL, Then and Now', s: 'text→sql',
    dek: 'In 2018 I helped build an RNN model that turned English questions into SQL. What that project looks like from the LLM era.',
    tags: ['nlp', 'llm', 'research'], min: 3, series: 'research',
    links: ['agent-harness-vs-rag'] },
];
