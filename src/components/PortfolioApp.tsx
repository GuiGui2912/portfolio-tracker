'use client'
// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'portfolio-tracker-auth',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }
  }
);

const EUR_RATE = 0.92;

const ASSET_INFO_STATIC = {
  BTC:   { sector:"Crypto",            yield:"0%",   beta:"—",   description:"Bitcoin est la première cryptomonnaie décentralisée, créée en 2009. Protocole blockchain de preuve de travail.", exchange:"Crypto",  country:"—"  },
  ETH:   { sector:"Crypto",            yield:"0%",   beta:"—",   description:"Ethereum est la plateforme de référence pour les contrats intelligents et applications décentralisées.", exchange:"Crypto",  country:"—"  },
  SOL:   { sector:"Crypto",            yield:"0%",   beta:"—",   description:"Solana est une blockchain haute performance capable de traiter des milliers de transactions par seconde.", exchange:"Crypto",  country:"—"  },
  XRP:   { sector:"Crypto",            yield:"0%",   beta:"—",   description:"Ripple est un protocole de paiement décentralisé conçu pour les transferts internationaux rapides.", exchange:"Crypto",  country:"—"  },
  DOGE:  { sector:"Crypto",            yield:"0%",   beta:"—",   description:"Dogecoin, initialement créé comme mème, est devenu l'une des cryptomonnaies les plus connues.", exchange:"Crypto",  country:"—"  },
  AAPL:  { sector:"Technologie",       yield:"0.5%", beta:"1.2", description:"Apple Inc. conçoit et commercialise des produits électroniques grand public. Leader mondial avec l'iPhone, le Mac et l'iPad.", exchange:"NASDAQ", country:"🇺🇸" },
  NVDA:  { sector:"Semi-conducteurs",  yield:"0.03%",beta:"1.8", description:"NVIDIA Corporation conçoit des puces graphiques (GPU) et des solutions d'IA. Leader incontesté avec ses accélérateurs H100/H200.", exchange:"NASDAQ", country:"🇺🇸" },
  TSLA:  { sector:"Automobile",        yield:"0%",   beta:"2.1", description:"Tesla conçoit des véhicules électriques, des systèmes de stockage d'énergie et des panneaux solaires.", exchange:"NASDAQ", country:"🇺🇸" },
  MSFT:  { sector:"Technologie",       yield:"0.7%", beta:"0.9", description:"Microsoft développe des logiciels, services cloud (Azure) et matériels. Leader mondial avec Windows et Office.", exchange:"NASDAQ", country:"🇺🇸" },
  AMZN:  { sector:"Tech / Commerce",   yield:"0%",   beta:"1.3", description:"Amazon est le leader mondial du e-commerce et du cloud computing (AWS).", exchange:"NASDAQ", country:"🇺🇸" },
  GOOGL: { sector:"Technologie",       yield:"0%",   beta:"1.1", description:"Alphabet est la maison mère de Google, leader de la publicité en ligne et de la recherche sur internet.", exchange:"NASDAQ", country:"🇺🇸" },
  META:  { sector:"Technologie",       yield:"0.3%", beta:"1.2", description:"Meta Platforms exploite Facebook, Instagram et WhatsApp. Leader des réseaux sociaux mondiaux.", exchange:"NASDAQ", country:"🇺🇸" },
  NFLX:  { sector:"Streaming",         yield:"0%",   beta:"1.3", description:"Netflix est le leader mondial du streaming vidéo avec plus de 260 millions d'abonnés.", exchange:"NASDAQ", country:"🇺🇸" },
  AMD:   { sector:"Semi-conducteurs",  yield:"0%",   beta:"1.7", description:"AMD conçoit des processeurs et GPU pour PC, serveurs et jeux vidéo. Concurrent direct d'Intel et NVIDIA.", exchange:"NASDAQ", country:"🇺🇸" },
  JPM:   { sector:"Finance",           yield:"2.2%", beta:"1.1", description:"JPMorgan Chase est la plus grande banque américaine par actifs totaux.", exchange:"NYSE",   country:"🇺🇸" },
  V:     { sector:"Finance",           yield:"0.7%", beta:"0.9", description:"Visa opère le plus grand réseau mondial de paiements électroniques.", exchange:"NYSE",   country:"🇺🇸" },
  MA:    { sector:"Finance",           yield:"0.5%", beta:"1.0", description:"Mastercard est l'un des plus grands réseaux de paiement au monde.", exchange:"NYSE",   country:"🇺🇸" },
  WU:    { sector:"Services financiers",yield:"6.5%",beta:"0.8", description:"Western Union est le leader mondial des transferts d'argent internationaux, présent dans plus de 200 pays.", exchange:"NYSE",   country:"🇺🇸" },
  PFE:   { sector:"Pharmacie",         yield:"6.8%", beta:"0.6", description:"Pfizer est l'un des plus grands groupes pharmaceutiques mondiaux, connu notamment pour son vaccin COVID-19.", exchange:"NYSE",   country:"🇺🇸" },
  JNJ:   { sector:"Santé",             yield:"3.2%", beta:"0.6", description:"Johnson & Johnson est un conglomérat de santé couvrant pharmaceutique, dispositifs médicaux et produits grand public.", exchange:"NYSE",   country:"🇺🇸" },
  KO:    { sector:"Boissons",          yield:"3.1%", beta:"0.6", description:"Coca-Cola est le leader mondial des boissons non alcoolisées, présent dans plus de 200 pays.", exchange:"NYSE",   country:"🇺🇸" },
  XOM:   { sector:"Énergie",           yield:"3.4%", beta:"0.9", description:"ExxonMobil est l'une des plus grandes compagnies pétrolières et gazières au monde.", exchange:"NYSE",   country:"🇺🇸" },
  T:     { sector:"Télécommunications",yield:"6.5%", beta:"0.7", description:"AT&T est l'un des plus grands opérateurs télécoms américains, offrant services mobiles et internet.", exchange:"NYSE",   country:"🇺🇸" },
  "TTE":   { sector:"Énergie",         yield:"4.8%", beta:"0.7", description:"TotalEnergies est une major énergétique française.", exchange:"Euronext", country:"🇫🇷" },
  "TTE.PA":{ sector:"Énergie",         yield:"4.8%", beta:"0.7", description:"TotalEnergies est une major énergétique française.", exchange:"Euronext", country:"🇫🇷" },
  "MC.PA": { sector:"Luxe",            yield:"1.8%", beta:"1.1", description:"LVMH est le premier groupe mondial de produits de luxe.", exchange:"Euronext", country:"🇫🇷" },
  "OR.PA": { sector:"Cosmétiques",     yield:"2.0%", beta:"0.9", description:"L'Oréal est le leader mondial des cosmétiques.", exchange:"Euronext", country:"🇫🇷" },
  "AIR.PA":{ sector:"Aéronautique",    yield:"1.4%", beta:"1.3", description:"Airbus est le leader européen de l'aéronautique.", exchange:"Euronext", country:"🇫🇷" },
  "BNP.PA":{ sector:"Finance",         yield:"7.2%", beta:"1.3", description:"BNP Paribas est la première banque française.", exchange:"Euronext", country:"🇫🇷" },
  "SAN.PA":{ sector:"Pharmacie",       yield:"4.1%", beta:"0.5", description:"Sanofi est un groupe pharmaceutique français.", exchange:"Euronext", country:"🇫🇷" },
  "SU.PA": { sector:"Industrie",       yield:"1.9%", beta:"1.0", description:"Schneider Electric est un leader mondial de la gestion de l'énergie.", exchange:"Euronext", country:"🇫🇷" },
  "AI.PA": { sector:"Chimie / Gaz",    yield:"2.1%", beta:"0.8", description:"Air Liquide est le leader mondial des gaz industriels.", exchange:"Euronext", country:"🇫🇷" },
  "SAF.PA":{ sector:"Aéronautique",    yield:"1.2%", beta:"1.1", description:"Safran est un groupe industriel français.", exchange:"Euronext", country:"🇫🇷" },
  "KER.PA":{ sector:"Luxe",            yield:"2.5%", beta:"1.2", description:"Kering est un groupe de luxe français.", exchange:"Euronext", country:"🇫🇷" },
  AZN:   { sector:"Pharmacie",         yield:"2.2%", beta:"0.5", description:"AstraZeneca est un groupe biopharmaceutique britannique.", exchange:"NASDAQ", country:"🇬🇧" },
  BP:    { sector:"Énergie",           yield:"5.2%", beta:"0.8", description:"BP est une major pétrolière britannique.", exchange:"NYSE",   country:"🇬🇧" },
  SHEL:  { sector:"Énergie",           yield:"3.9%", beta:"0.8", description:"Shell est l'une des plus grandes compagnies énergétiques mondiales.", exchange:"NYSE",   country:"🇬🇧" },
  SAP:   { sector:"Technologie",       yield:"1.4%", beta:"0.9", description:"SAP est le leader européen des logiciels d'entreprise.", exchange:"NYSE",   country:"🇩🇪" },
  NVO:   { sector:"Pharmacie",         yield:"1.5%", beta:"0.6", description:"Novo Nordisk est un groupe danois leader dans le diabète.", exchange:"NYSE",   country:"🇩🇰" },
  ASML:  { sector:"Semi-conducteurs",  yield:"0.8%", beta:"1.3", description:"ASML est le seul fabricant mondial de machines lithographiques EUV.", exchange:"NASDAQ", country:"🇳🇱" },
};

function getAssetInfo(symbol) {
  if (ASSET_INFO_STATIC[symbol]) return ASSET_INFO_STATIC[symbol];
  const db = SYMBOL_DATABASE.find(s => s.symbol === symbol);
  if (db) {
    const isCrypto = db.type === "crypto";
    const isETF    = db.type === "etf";
    return {
      sector: isCrypto ? "Crypto" : isETF ? "ETF" : "Action",
      yield:  isCrypto ? "0%" : "—",
      beta:   "—",
      description: `${db.name} (${symbol})${isETF?" est un fonds indiciel coté en bourse.":isCrypto?" est une cryptomonnaie.":" est une société cotée en bourse."}`,
      exchange: isCrypto ? "Crypto" : isETF ? "Bourse" : "Bourse",
      country: "",
    };
  }
  return { sector:"—", yield:"—", beta:"—", description:"Aucune information disponible pour cet actif.", exchange:"—", country:"" };
}

const generateHistory = (base, periods, volatility=0.015) => {
  const data = [base];
  for(let i=1;i<periods;i++){
    const prev = data[i-1];
    const change = prev * (1 + (Math.random()-0.48)*volatility);
    data.push(Math.round(change*100)/100);
  }
  return data;
};

const TIME_SCALES = [
  { label:"1S",  periods:7,   vol:0.012 },
  { label:"1M",  periods:30,  vol:0.015 },
  { label:"3M",  periods:90,  vol:0.018 },
  { label:"6M",  periods:180, vol:0.02  },
  { label:"1A",  periods:365, vol:0.022 },
  { label:"MAX", periods:730, vol:0.025 },
];

const buildHistories = (basePrice) => {
  const out = {};
  TIME_SCALES.forEach(ts => { out[ts.label] = generateHistory(basePrice, ts.periods, ts.vol); });
  return out;
};

const INITIAL_ASSETS = [
  { id:1, symbol:"BTC",  name:"Bitcoin",      type:"crypto", qty:0.42, price:68420,  change: 2.34,  color:"#F7931A", dividends:[] },
  { id:2, symbol:"ETH",  name:"Ethereum",     type:"crypto", qty:3.5,  price:3812,   change:-1.12,  color:"#627EEA", dividends:[] },
  { id:3, symbol:"AAPL", name:"Apple Inc.",   type:"stock",  qty:12,   price:189.3,  change: 0.87,  color:"#A3B8C2", dividends:[] },
  { id:4, symbol:"NVDA", name:"NVIDIA Corp.", type:"stock",  qty:8,    price:875.4,  change: 4.21,  color:"#76B900", dividends:[] },
  { id:5, symbol:"SOL",  name:"Solana",       type:"crypto", qty:25,   price:178.6,  change:-3.5,   color:"#9945FF", dividends:[] },
  { id:6, symbol:"TSLA", name:"Tesla Inc.",   type:"stock",  qty:5,    price:246.8,  change:-0.43,  color:"#CC0000", dividends:[] },
];
INITIAL_ASSETS.forEach(a => { a.histories = buildHistories(a.price); });

const ASSET_COLORS = ["#F7931A","#627EEA","#A3B8C2","#76B900","#9945FF","#CC0000","#00A4EF","#E91E8C","#FFD700","#00BCD4"];
const MOCK_BANKS = [];
const ACCOUNT_TYPE_LABEL = { checking:"Compte courant", savings:"Livret / Épargne", credit:"Carte de crédit" };
const CRYPTO_SYMBOLS = ["BTC","ETH","SOL","BNB","XRP","ADA","DOGE","AVAX","DOT","MATIC","LINK","UNI","ATOM","LTC","BCH","ALGO","XLM","VET","SAND","MANA","APT","OP","ARB","INJ","SUI","TIA","SEI","PEPE","WIF","BONK","JUP","PYTH"];

const SYMBOL_DATABASE = [
  { symbol:"BTC",   name:"Bitcoin",                  type:"crypto" },
  { symbol:"ETH",   name:"Ethereum",                 type:"crypto" },
  { symbol:"SOL",   name:"Solana",                   type:"crypto" },
  { symbol:"BNB",   name:"BNB",                      type:"crypto" },
  { symbol:"XRP",   name:"Ripple",                   type:"crypto" },
  { symbol:"ADA",   name:"Cardano",                  type:"crypto" },
  { symbol:"DOGE",  name:"Dogecoin",                 type:"crypto" },
  { symbol:"AVAX",  name:"Avalanche",                type:"crypto" },
  { symbol:"DOT",   name:"Polkadot",                 type:"crypto" },
  { symbol:"MATIC", name:"Polygon",                  type:"crypto" },
  { symbol:"LINK",  name:"Chainlink",                type:"crypto" },
  { symbol:"UNI",   name:"Uniswap",                  type:"crypto" },
  { symbol:"ATOM",  name:"Cosmos",                   type:"crypto" },
  { symbol:"LTC",   name:"Litecoin",                 type:"crypto" },
  { symbol:"BCH",   name:"Bitcoin Cash",             type:"crypto" },
  { symbol:"APT",   name:"Aptos",                    type:"crypto" },
  { symbol:"OP",    name:"Optimism",                 type:"crypto" },
  { symbol:"ARB",   name:"Arbitrum",                 type:"crypto" },
  { symbol:"INJ",   name:"Injective",                type:"crypto" },
  { symbol:"SUI",   name:"Sui",                      type:"crypto" },
  { symbol:"PEPE",  name:"Pepe",                     type:"crypto" },
  { symbol:"WIF",   name:"Dogwifhat",                type:"crypto" },
  { symbol:"BONK",  name:"Bonk",                     type:"crypto" },
  { symbol:"TIA",   name:"Celestia",                 type:"crypto" },
  { symbol:"SEI",   name:"Sei",                      type:"crypto" },
  { symbol:"JUP",   name:"Jupiter",                  type:"crypto" },
  { symbol:"NEAR",  name:"NEAR Protocol",            type:"crypto" },
  { symbol:"FTM",   name:"Fantom",                   type:"crypto" },
  { symbol:"SAND",  name:"The Sandbox",              type:"crypto" },
  { symbol:"MANA",  name:"Decentraland",             type:"crypto" },
  { symbol:"CRV",   name:"Curve DAO",                type:"crypto" },
  { symbol:"AAVE",  name:"Aave",                     type:"crypto" },
  { symbol:"MKR",   name:"Maker",                    type:"crypto" },
  { symbol:"SNX",   name:"Synthetix",                type:"crypto" },
  { symbol:"LDO",   name:"Lido DAO",                 type:"crypto" },
  { symbol:"RNDR",  name:"Render",                   type:"crypto" },
  { symbol:"FIL",   name:"Filecoin",                 type:"crypto" },
  { symbol:"ICP",   name:"Internet Computer",        type:"crypto" },
  { symbol:"HBAR",  name:"Hedera",                   type:"crypto" },
  { symbol:"VET",   name:"VeChain",                  type:"crypto" },
  { symbol:"XLM",   name:"Stellar",                  type:"crypto" },
  { symbol:"ALGO",  name:"Algorand",                 type:"crypto" },
  { symbol:"EOS",   name:"EOS",                      type:"crypto" },
  { symbol:"THETA", name:"Theta Network",            type:"crypto" },
  { symbol:"EGLD",  name:"MultiversX",               type:"crypto" },
  { symbol:"XMR",   name:"Monero",                   type:"crypto" },
  { symbol:"SHIB",  name:"Shiba Inu",                type:"crypto" },
  { symbol:"FLOKI", name:"Floki",                    type:"crypto" },
  { symbol:"TON",   name:"Toncoin",                  type:"crypto" },
  { symbol:"PYTH",  name:"Pyth Network",             type:"crypto" },
  { symbol:"AAPL",  name:"Apple Inc.",               type:"stock" },
  { symbol:"MSFT",  name:"Microsoft",                type:"stock" },
  { symbol:"NVDA",  name:"NVIDIA",                   type:"stock" },
  { symbol:"TSLA",  name:"Tesla",                    type:"stock" },
  { symbol:"AMZN",  name:"Amazon",                   type:"stock" },
  { symbol:"GOOGL", name:"Alphabet (Google) Class A",type:"stock" },
  { symbol:"GOOG",  name:"Alphabet (Google) Class C",type:"stock" },
  { symbol:"META",  name:"Meta Platforms",           type:"stock" },
  { symbol:"NFLX",  name:"Netflix",                  type:"stock" },
  { symbol:"AMD",   name:"AMD",                      type:"stock" },
  { symbol:"INTC",  name:"Intel",                    type:"stock" },
  { symbol:"CRM",   name:"Salesforce",               type:"stock" },
  { symbol:"ORCL",  name:"Oracle",                   type:"stock" },
  { symbol:"CSCO",  name:"Cisco Systems",            type:"stock" },
  { symbol:"ADBE",  name:"Adobe",                    type:"stock" },
  { symbol:"NOW",   name:"ServiceNow",               type:"stock" },
  { symbol:"INTU",  name:"Intuit",                   type:"stock" },
  { symbol:"QCOM",  name:"Qualcomm",                 type:"stock" },
  { symbol:"TXN",   name:"Texas Instruments",        type:"stock" },
  { symbol:"AVGO",  name:"Broadcom",                 type:"stock" },
  { symbol:"AMAT",  name:"Applied Materials",        type:"stock" },
  { symbol:"MU",    name:"Micron Technology",        type:"stock" },
  { symbol:"LRCX",  name:"Lam Research",             type:"stock" },
  { symbol:"KLAC",  name:"KLA Corporation",          type:"stock" },
  { symbol:"MRVL",  name:"Marvell Technology",       type:"stock" },
  { symbol:"COIN",  name:"Coinbase",                 type:"stock" },
  { symbol:"PLTR",  name:"Palantir",                 type:"stock" },
  { symbol:"SNOW",  name:"Snowflake",                type:"stock" },
  { symbol:"SPOT",  name:"Spotify",                  type:"stock" },
  { symbol:"SHOP",  name:"Shopify",                  type:"stock" },
  { symbol:"UBER",  name:"Uber",                     type:"stock" },
  { symbol:"LYFT",  name:"Lyft",                     type:"stock" },
  { symbol:"ABNB",  name:"Airbnb",                   type:"stock" },
  { symbol:"DASH",  name:"DoorDash",                 type:"stock" },
  { symbol:"RBLX",  name:"Roblox",                   type:"stock" },
  { symbol:"RIVN",  name:"Rivian",                   type:"stock" },
  { symbol:"LCID",  name:"Lucid Motors",             type:"stock" },
  { symbol:"BABA",  name:"Alibaba",                  type:"stock" },
  { symbol:"TSM",   name:"Taiwan Semiconductor",     type:"stock" },
  { symbol:"ASML",  name:"ASML Holding",             type:"stock" },
  { symbol:"V",     name:"Visa",                     type:"stock" },
  { symbol:"MA",    name:"Mastercard",               type:"stock" },
  { symbol:"JPM",   name:"JPMorgan Chase",           type:"stock" },
  { symbol:"BAC",   name:"Bank of America",          type:"stock" },
  { symbol:"GS",    name:"Goldman Sachs",            type:"stock" },
  { symbol:"MS",    name:"Morgan Stanley",           type:"stock" },
  { symbol:"WFC",   name:"Wells Fargo",              type:"stock" },
  { symbol:"C",     name:"Citigroup",                type:"stock" },
  { symbol:"AXP",   name:"American Express",         type:"stock" },
  { symbol:"BLK",   name:"BlackRock",                type:"stock" },
  { symbol:"BRK.B", name:"Berkshire Hathaway",       type:"stock" },
  { symbol:"SCHW",  name:"Charles Schwab",           type:"stock" },
  { symbol:"CME",   name:"CME Group",                type:"stock" },
  { symbol:"ICE",   name:"Intercontinental Exchange",type:"stock" },
  { symbol:"PYPL",  name:"PayPal",                   type:"stock" },
  { symbol:"SQ",    name:"Block (Square)",           type:"stock" },
  { symbol:"JNJ",   name:"Johnson & Johnson",        type:"stock" },
  { symbol:"PFE",   name:"Pfizer",                   type:"stock" },
  { symbol:"MRNA",  name:"Moderna",                  type:"stock" },
  { symbol:"ABBV",  name:"AbbVie",                   type:"stock" },
  { symbol:"MRK",   name:"Merck",                    type:"stock" },
  { symbol:"LLY",   name:"Eli Lilly",                type:"stock" },
  { symbol:"BMY",   name:"Bristol-Myers Squibb",     type:"stock" },
  { symbol:"AMGN",  name:"Amgen",                    type:"stock" },
  { symbol:"GILD",  name:"Gilead Sciences",          type:"stock" },
  { symbol:"ISRG",  name:"Intuitive Surgical",       type:"stock" },
  { symbol:"MDT",   name:"Medtronic",                type:"stock" },
  { symbol:"UNH",   name:"UnitedHealth Group",       type:"stock" },
  { symbol:"CVS",   name:"CVS Health",               type:"stock" },
  { symbol:"CI",    name:"Cigna",                    type:"stock" },
  { symbol:"XOM",   name:"ExxonMobil",               type:"stock" },
  { symbol:"CVX",   name:"Chevron",                  type:"stock" },
  { symbol:"COP",   name:"ConocoPhillips",           type:"stock" },
  { symbol:"SLB",   name:"Schlumberger",             type:"stock" },
  { symbol:"EOG",   name:"EOG Resources",            type:"stock" },
  { symbol:"PSX",   name:"Phillips 66",              type:"stock" },
  { symbol:"MPC",   name:"Marathon Petroleum",       type:"stock" },
  { symbol:"OXY",   name:"Occidental Petroleum",     type:"stock" },
  { symbol:"ENPH",  name:"Enphase Energy",           type:"stock" },
  { symbol:"FSLR",  name:"First Solar",              type:"stock" },
  { symbol:"NEE",   name:"NextEra Energy",           type:"stock" },
  { symbol:"KO",    name:"Coca-Cola",                type:"stock" },
  { symbol:"PEP",   name:"PepsiCo",                  type:"stock" },
  { symbol:"MCD",   name:"McDonald's",               type:"stock" },
  { symbol:"SBUX",  name:"Starbucks",                type:"stock" },
  { symbol:"NKE",   name:"Nike",                     type:"stock" },
  { symbol:"DIS",   name:"Walt Disney",              type:"stock" },
  { symbol:"WMT",   name:"Walmart",                  type:"stock" },
  { symbol:"TGT",   name:"Target",                   type:"stock" },
  { symbol:"COST",  name:"Costco",                   type:"stock" },
  { symbol:"HD",    name:"Home Depot",               type:"stock" },
  { symbol:"LOW",   name:"Lowe's",                   type:"stock" },
  { symbol:"PM",    name:"Philip Morris",            type:"stock" },
  { symbol:"MO",    name:"Altria Group",             type:"stock" },
  { symbol:"PG",    name:"Procter & Gamble",         type:"stock" },
  { symbol:"CL",    name:"Colgate-Palmolive",        type:"stock" },
  { symbol:"KHC",   name:"Kraft Heinz",              type:"stock" },
  { symbol:"WU",    name:"Western Union",            type:"stock" },
  { symbol:"T",     name:"AT&T",                     type:"stock" },
  { symbol:"VZ",    name:"Verizon",                  type:"stock" },
  { symbol:"TMUS",  name:"T-Mobile US",              type:"stock" },
  { symbol:"CMCSA", name:"Comcast",                  type:"stock" },
  { symbol:"PARA",  name:"Paramount Global",         type:"stock" },
  { symbol:"WBD",   name:"Warner Bros. Discovery",   type:"stock" },
  { symbol:"BA",    name:"Boeing",                   type:"stock" },
  { symbol:"CAT",   name:"Caterpillar",              type:"stock" },
  { symbol:"DE",    name:"John Deere",               type:"stock" },
  { symbol:"GE",    name:"GE Aerospace",             type:"stock" },
  { symbol:"HON",   name:"Honeywell",                type:"stock" },
  { symbol:"MMM",   name:"3M",                       type:"stock" },
  { symbol:"RTX",   name:"RTX Corporation",          type:"stock" },
  { symbol:"LMT",   name:"Lockheed Martin",          type:"stock" },
  { symbol:"GD",    name:"General Dynamics",         type:"stock" },
  { symbol:"NOC",   name:"Northrop Grumman",         type:"stock" },
  { symbol:"UPS",   name:"UPS",                      type:"stock" },
  { symbol:"FDX",   name:"FedEx",                    type:"stock" },
  { symbol:"TTE",   name:"TotalEnergies",            type:"stock" },
  { symbol:"LVMH",  name:"LVMH Moët Hennessy",       type:"stock" },
  { symbol:"MC.PA", name:"LVMH (Euronext Paris)",    type:"stock" },
  { symbol:"OR.PA", name:"L'Oréal (Paris)",          type:"stock" },
  { symbol:"TTE.PA",name:"TotalEnergies (Paris)",    type:"stock" },
  { symbol:"BNP.PA",name:"BNP Paribas (Paris)",      type:"stock" },
  { symbol:"SAN.PA",name:"Sanofi (Paris)",           type:"stock" },
  { symbol:"AIR.PA",name:"Airbus (Paris)",           type:"stock" },
  { symbol:"KER.PA",name:"Kering (Paris)",           type:"stock" },
  { symbol:"HO.PA", name:"Thales (Paris)",           type:"stock" },
  { symbol:"DG.PA", name:"Vinci (Paris)",            type:"stock" },
  { symbol:"RI.PA", name:"Pernod Ricard (Paris)",    type:"stock" },
  { symbol:"ACA.PA",name:"Crédit Agricole (Paris)",  type:"stock" },
  { symbol:"GLE.PA",name:"Société Générale (Paris)", type:"stock" },
  { symbol:"SGO.PA",name:"Saint-Gobain (Paris)",     type:"stock" },
  { symbol:"CAP.PA",name:"Capgemini (Paris)",        type:"stock" },
  { symbol:"DSY.PA",name:"Dassault Systèmes (Paris)",type:"stock" },
  { symbol:"STLA",  name:"Stellantis",               type:"stock" },
  { symbol:"ENGI.PA",name:"Engie (Paris)",           type:"stock" },
  { symbol:"CS.PA", name:"AXA (Paris)",              type:"stock" },
  { symbol:"ORA.PA",name:"Orange (Paris)",           type:"stock" },
  { symbol:"VIE.PA",name:"Veolia (Paris)",           type:"stock" },
  { symbol:"ML.PA", name:"Michelin (Paris)",         type:"stock" },
  { symbol:"RNO.PA",name:"Renault (Paris)",          type:"stock" },
  { symbol:"PUB.PA",name:"Publicis (Paris)",         type:"stock" },
  { symbol:"SU.PA", name:"Schneider Electric (Paris)",type:"stock"},
  { symbol:"AI.PA", name:"Air Liquide (Paris)",      type:"stock" },
  { symbol:"SAF.PA",name:"Safran (Paris)",           type:"stock" },
  { symbol:"SAP",   name:"SAP SE",                   type:"stock" },
  { symbol:"SIEGY", name:"Siemens",                  type:"stock" },
  { symbol:"BAYN.DE",name:"Bayer (Frankfurt)",       type:"stock" },
  { symbol:"BASF.DE",name:"BASF (Frankfurt)",        type:"stock" },
  { symbol:"VOW3.DE",name:"Volkswagen (Frankfurt)",  type:"stock" },
  { symbol:"BMW.DE", name:"BMW (Frankfurt)",         type:"stock" },
  { symbol:"DBK.DE", name:"Deutsche Bank (Frankfurt)",type:"stock"},
  { symbol:"AZN",   name:"AstraZeneca",              type:"stock" },
  { symbol:"HSBA.L",name:"HSBC (London)",            type:"stock" },
  { symbol:"BP",    name:"BP",                       type:"stock" },
  { symbol:"SHEL",  name:"Shell",                    type:"stock" },
  { symbol:"UL",    name:"Unilever",                 type:"stock" },
  { symbol:"NVO",   name:"Novo Nordisk",             type:"stock" },
  { symbol:"NESN.SW",name:"Nestlé (Zurich)",         type:"stock" },
  { symbol:"ROG.SW",name:"Roche (Zurich)",           type:"stock" },
  { symbol:"NOVN.SW",name:"Novartis (Zurich)",       type:"stock" },
  { symbol:"ABB",   name:"ABB Ltd",                  type:"stock" },
  { symbol:"ERICB.ST",name:"Ericsson (Stockholm)",   type:"stock" },
  { symbol:"ERIC",  name:"Ericsson",                 type:"stock" },
  { symbol:"NTES",  name:"NetEase",                  type:"stock" },
  { symbol:"TCEHY", name:"Tencent",                  type:"stock" },
  { symbol:"PDD",   name:"PDD Holdings (Temu)",      type:"stock" },
  { symbol:"SPY",   name:"SPDR S&P 500 ETF",         type:"etf" },
  { symbol:"QQQ",   name:"Invesco Nasdaq 100 ETF",   type:"etf" },
  { symbol:"VTI",   name:"Vanguard Total Market ETF",type:"etf" },
  { symbol:"VOO",   name:"Vanguard S&P 500 ETF",     type:"etf" },
  { symbol:"IVV",   name:"iShares S&P 500 ETF",      type:"etf" },
  { symbol:"VEA",   name:"Vanguard Developed Markets",type:"etf"},
  { symbol:"VWO",   name:"Vanguard Emerging Markets", type:"etf"},
  { symbol:"ARKK",  name:"ARK Innovation ETF",       type:"etf" },
  { symbol:"GLD",   name:"SPDR Gold Shares ETF",     type:"etf" },
  { symbol:"SLV",   name:"iShares Silver Trust ETF", type:"etf" },
  { symbol:"IWM",   name:"iShares Russell 2000 ETF", type:"etf" },
  { symbol:"XLK",   name:"Technology Select SPDR",   type:"etf" },
  { symbol:"XLF",   name:"Financial Select SPDR",    type:"etf" },
  { symbol:"XLE",   name:"Energy Select SPDR",       type:"etf" },
  { symbol:"SOXX",  name:"iShares Semiconductor ETF",type:"etf" },
  { symbol:"CSPX.L",name:"iShares Core S&P 500 (London)",type:"etf"},
  { symbol:"IWDA.AS",name:"iShares MSCI World (Amsterdam)",type:"etf"},
  { symbol:"VWCE.DE",name:"Vanguard FTSE All-World (Frankfurt)",type:"etf"},
  { symbol:"CW8.PA",name:"Amundi MSCI World (Paris)",type:"etf" },
  { symbol:"ESE.PA",name:"BNP Paribas S&P 500 (Paris)",type:"etf"},
];

function useFmt(currency) {
  const rate = currency === "EUR" ? EUR_RATE : 1;
  const sym  = currency === "EUR" ? "€" : "$";
  return (v, dec=0) => {
    const val = (v * rate).toLocaleString("fr-FR", { maximumFractionDigits:dec, minimumFractionDigits:dec>0?dec:0 });
    return currency === "EUR" ? val + "\u00A0" + sym : sym + val;
  };
}

function MiniChart({ data, color, w=72, h=30, strokeWidth=1.5, showDots=false, showGrid=false }) {
  if(!data||!data.length) return null;
  const min=Math.min(...data),max=Math.max(...data);
  const range=max-min||1;
  const pad=showGrid?14:0;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*(w-pad*0)+pad/2},${h-((v-min)/range)*(h-6)-3}`).join(" ");
  const uid=(color+w+h+strokeWidth).replace(/[#.\s]/g,"x");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {showGrid && [0.25,0.5,0.75].map(p=>(
        <line key={p} x1={0} y1={h*p} x2={w} y2={h*p} stroke="#ffffff08" strokeWidth="1"/>
      ))}
      <polygon points={`${pts} ${w-pad/2},${h} ${pad/2},${h}`} fill={`url(#g${uid})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
      {showDots && data.map((v,i)=>{
        const x=(i/(data.length-1))*(w-pad)+pad/2;
        const y=h-((v-min)/range)*(h-6)-3;
        return <circle key={i} cx={x} cy={y} r="2.5" fill={color} opacity="0.9"/>;
      })}
    </svg>
  );
}

function SymbolSearch({ value, onChange, onSelect, placeholder, error }) {
  const [open, setOpen]     = useState(false);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const ref      = useRef(null);
  const fetchRef = useRef(null);

  const suggestions = value.length >= 1
    ? SYMBOL_DATABASE.filter(s =>
        s.symbol.startsWith(value.toUpperCase()) ||
        s.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    if (!suggestions.length) return;
    clearTimeout(fetchRef.current);
    fetchRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const cryptos = suggestions.filter(s=>s.type==="crypto").map(s=>s.symbol).join(",");
        const stocks  = suggestions.filter(s=>s.type!=="crypto").map(s=>s.symbol).join(",");
        const results = {};
        await Promise.all([
          cryptos && fetch(`/api/prices/crypto?symbols=${cryptos}`).then(r=>r.ok?r.json():{}).then(d=>Object.assign(results,d)),
          stocks  && fetch(`/api/prices/stocks?symbols=${stocks}`).then(r=>r.ok?r.json():{}).then(d=>Object.assign(results,d)),
        ].filter(Boolean));
        setPrices(results);
      } catch {}
      setLoading(false);
    }, 400);
    return () => clearTimeout(fetchRef.current);
  }, [suggestions.map(s=>s.symbol).join(",")]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const typeColor = { crypto:"#F7931A", stock:"#A3B8C2", etf:"#00A4EF" };
  const typeLabel = { crypto:"Crypto", stock:"Action", etf:"ETF" };

  const fmtPrice = (p) => {
    if (!p) return null;
    if (p >= 1000) return p.toLocaleString("fr-FR", {maximumFractionDigits:0});
    if (p >= 1)    return p.toLocaleString("fr-FR", {maximumFractionDigits:2});
    return p.toLocaleString("fr-FR", {maximumFractionDigits:4});
  };

  return (
    <div ref={ref} style={{position:"relative"}}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value.toUpperCase()); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={{width:"100%",background:"#0E0D0A",border:`1px solid ${error?"#F87171":"#252015"}`,borderRadius:12,padding:"11px 13px",color:"#F0EDE8",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none"}}
      />
      {error && <div style={{color:"#F87171",fontSize:10,marginTop:3}}>{error}</div>}
      {open && suggestions.length > 0 && (
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:2000,background:"#1A1714",border:"1px solid #2A2520",borderRadius:12,overflow:"hidden",marginTop:4,boxShadow:"0 8px 24px #000a"}}>
          {suggestions.map(s => {
            const p = prices[s.symbol];
            const pos = p ? p.change24h >= 0 : null;
            return (
              <div key={s.symbol} onClick={() => { onSelect(s); setOpen(false); }}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 13px",cursor:"pointer",borderBottom:"1px solid #1E1B16",transition:"background 0.1s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#252015"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:32,height:32,borderRadius:9,background:`${typeColor[s.type]}15`,border:`1px solid ${typeColor[s.type]}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:typeColor[s.type],fontFamily:"'DM Mono',monospace"}}>
                    {s.symbol.slice(0,2)}
                  </div>
                  <div>
                    <div style={{color:"#F0EDE8",fontWeight:600,fontSize:13,fontFamily:"'DM Mono',monospace"}}>{s.name}</div>
                    <div style={{color:"#5A5550",fontSize:11,marginTop:1,fontFamily:"'DM Mono',monospace"}}>{s.symbol}</div>
                  </div>
                </div>
                <div style={{textAlign:"right",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
                  {p ? (
                    <>
                      <span style={{color:"#F0EDE8",fontSize:13,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{fmtPrice(p.price)}</span>
                      <span style={{color:pos?"#4ADE80":"#F87171",fontSize:10,fontFamily:"'DM Mono',monospace",fontWeight:600}}>
                        {pos?"▲":"▼"} {Math.abs(p.change24h??0).toFixed(2)}%
                      </span>
                    </>
                  ) : (
                    <span style={{background:`${typeColor[s.type]}20`,color:typeColor[s.type],fontSize:9,fontWeight:700,borderRadius:6,padding:"2px 7px",fontFamily:"'DM Mono',monospace"}}>
                      {loading ? "…" : typeLabel[s.type]}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InputField({ form, errors, onChange, fkey, label, placeholder, type }) {
  return (
    <div>
      <div style={{color:"#6A6560",fontSize:10,marginBottom:5,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>{label}</div>
      <input
        type={type} value={form[fkey]} onChange={e => onChange(fkey, e.target.value)} placeholder={placeholder}
        style={{width:"100%",background:"#0E0D0A",border:`1px solid ${errors[fkey]?"#F87171":"#252015"}`,borderRadius:12,padding:"11px 13px",color:"#F0EDE8",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none"}}
      />
      {errors[fkey] && <div style={{color:"#F87171",fontSize:10,marginTop:3}}>{errors[fkey]}</div>}
    </div>
  );
}

function AddAssetModal({ onClose, onAdd }) {
  const [step, setStep]           = useState(0);
  const [assetType, setAssetType] = useState(null);
  const today = new Date().toISOString().slice(0,10);
  const nowTime = new Date().toTimeString().slice(0,5);
  const [form, setForm] = useState({ symbol:"", name:"", color:ASSET_COLORS[0], buyDate:today, buyTime:nowTime, buyPrice:"", buyQty:"", buyCurrency:"USD", priceMode:"unit" });
  const [errors, setErrors] = useState({});
  const typeOptions = [
    { value:"stock",  label:"Action",  emoji:"📈", desc:"AAPL, MSFT, LVMH…" },
    { value:"etf",    label:"ETF",     emoji:"🗂",  desc:"SP500, MSCI World…" },
    { value:"crypto", label:"Crypto",  emoji:"₿",  desc:"BTC, ETH, SOL…" },
  ];
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const validate = () => {
    const e = {};
    if (!form.symbol.trim()) e.symbol = "Requis";
    if (!form.name.trim()) e.name = "Requis";
    if (!form.buyDate) e.buyDate = "Requis";
    if (!form.buyTime) e.buyTime = "Requis";
    if (!form.buyPrice || isNaN(+form.buyPrice) || +form.buyPrice <= 0) e.buyPrice = "Prix positif requis";
    if (!form.buyQty   || isNaN(+form.buyQty)  || +form.buyQty  <= 0) e.buyQty = "Quantité positive requise";
    setErrors(e);
    return !Object.keys(e).length;
  };
  const submit = () => {
    if (!validate()) return;
    const fxRate = form.buyCurrency === "EUR" ? (1/EUR_RATE) : form.buyCurrency === "GBP" ? 1.27 : 1;
    const qty = +form.buyQty;
    const unitPriceInCurrency = form.priceMode === "total" ? +form.buyPrice / qty : +form.buyPrice;
    const unitPriceUSD = unitPriceInCurrency * fxRate;
    const newAsset = {
      id: crypto.randomUUID(), symbol: form.symbol.toUpperCase().trim(), name: form.name.trim(),
      type: assetType, qty, price: Math.round(unitPriceUSD * 100) / 100, change: 0,
      color: form.color, dividends: [], histories: buildHistories(unitPriceUSD),
      purchase: { date:form.buyDate, time:form.buyTime, priceUSD:unitPriceUSD, priceOriginal:unitPriceInCurrency, currency:form.buyCurrency, priceMode:form.priceMode, qty },
    };
    onAdd(newAsset); onClose();
  };
  const transactionFields = [["buyDate","Date d'achat","","date"],["buyTime","Heure d'achat","","time"]];
  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"#000000AA",backdropFilter:"blur(6px)"}}>
      <div className="fadein" style={{width:390,background:"#1A1714",borderRadius:"28px 28px 0 0",padding:"22px 22px 40px",border:"1px solid #2A2520",borderBottom:"none",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{width:36,height:4,borderRadius:2,background:"#3A3530",margin:"0 auto 18px"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div>
            <div style={{color:"#F0EDE8",fontSize:17,fontWeight:700}}>{step===0?"Ajouter un actif":`Nouvel actif · ${typeOptions.find(t=>t.value===assetType)?.label}`}</div>
            {step===1&&assetType&&<div style={{color:"#5A5550",fontSize:11,marginTop:2}}>{typeOptions.find(t=>t.value===assetType)?.desc}</div>}
          </div>
          <button onClick={onClose} style={{background:"#252015",border:"none",width:32,height:32,borderRadius:10,cursor:"pointer",color:"#8B8580",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {step===0 && (
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {typeOptions.map(t=>(
              <button key={t.value} onClick={()=>{setAssetType(t.value);setStep(1);}}
                style={{background:"#111009",border:"1px solid #252015",borderRadius:16,padding:"15px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:13,textAlign:"left",transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#C8A96E60";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#252015";}}>
                <div style={{width:42,height:42,borderRadius:13,background:"#1A1714",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{t.emoji}</div>
                <div><div style={{color:"#F0EDE8",fontWeight:600,fontSize:14}}>{t.label}</div><div style={{color:"#5A5550",fontSize:11,marginTop:2}}>{t.desc}</div></div>
                <div style={{marginLeft:"auto",color:"#3A3530",fontSize:18}}>›</div>
              </button>
            ))}
          </div>
        )}
        {step===1 && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:"#111009",borderRadius:14,padding:"14px",border:"1px solid #1E1B16"}}>
              <div style={{color:"#5A5550",fontSize:9,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>Actif</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div>
                  <div style={{color:"#6A6560",fontSize:10,marginBottom:5,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>Symbole / Ticker</div>
                  <SymbolSearch value={form.symbol} onChange={v=>set("symbol",v)} onSelect={s=>{set("symbol",s.symbol);set("name",s.name);setAssetType(s.type);}} placeholder="ex : AAPL, BTC…" error={errors.symbol}/>
                </div>
                <InputField key="name" form={form} errors={errors} onChange={set} fkey="name" label="Nom complet" placeholder="ex : Apple Inc." type="text"/>
              </div>
            </div>
            <div style={{background:"#111009",borderRadius:14,padding:"14px",border:"1px solid #1E1B16"}}>
              <div style={{color:"#5A5550",fontSize:9,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>Transaction d'achat</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                {transactionFields.map(([k,l,p,t])=><InputField key={k} form={form} errors={errors} onChange={set} fkey={k} label={l} placeholder={p} type={t}/>)}
              </div>
              <div style={{marginBottom:10}}>
                <div style={{color:"#6A6560",fontSize:10,marginBottom:5,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>Devise du prix d'achat</div>
                <div style={{display:"flex",gap:6}}>
                  {[["USD","$"],["EUR","€"],["GBP","£"]].map(([cur,sym])=>(
                    <button key={cur} onClick={()=>set("buyCurrency",cur)} style={{flex:1,padding:"9px 0",border:`1px solid ${form.buyCurrency===cur?"#C8A96E60":"#252015"}`,borderRadius:10,background:form.buyCurrency===cur?"#C8A96E15":"#0E0D0A",color:form.buyCurrency===cur?"#C8A96E":"#5A5550",fontSize:12,fontWeight:form.buyCurrency===cur?700:500,cursor:"pointer",fontFamily:"'DM Mono',monospace",transition:"all 0.2s"}}>{sym} {cur}</button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{color:"#6A6560",fontSize:10,marginBottom:5,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>Type de prix saisi</div>
                <div style={{display:"flex",gap:6}}>
                  {[["unit","Par unité"],["total","Montant total"]].map(([mode,label])=>(
                    <button key={mode} onClick={()=>set("priceMode",mode)} style={{flex:1,padding:"9px 0",border:`1px solid ${form.priceMode===mode?"#C8A96E60":"#252015"}`,borderRadius:10,background:form.priceMode===mode?"#C8A96E15":"#0E0D0A",color:form.priceMode===mode?"#C8A96E":"#5A5550",fontSize:12,fontWeight:form.priceMode===mode?700:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.2s"}}>{label}</button>
                  ))}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <div style={{color:"#6A6560",fontSize:10,marginBottom:5,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>{form.priceMode==="unit"?`Prix unitaire (${form.buyCurrency})`:`Montant total (${form.buyCurrency})`}</div>
                  <input type="number" value={form.buyPrice} onChange={e=>set("buyPrice",e.target.value)} placeholder={form.priceMode==="unit"?"ex : 189.30":"ex : 1893.00"} style={{width:"100%",background:"#0E0D0A",border:`1px solid ${errors.buyPrice?"#F87171":"#252015"}`,borderRadius:12,padding:"11px 13px",color:"#F0EDE8",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none"}}/>
                  {errors.buyPrice && <div style={{color:"#F87171",fontSize:10,marginTop:3}}>{errors.buyPrice}</div>}
                </div>
                <div>
                  <div style={{color:"#6A6560",fontSize:10,marginBottom:5,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>Quantité</div>
                  <input type="number" value={form.buyQty} onChange={e=>set("buyQty",e.target.value)} placeholder="ex : 10" style={{width:"100%",background:"#0E0D0A",border:`1px solid ${errors.buyQty?"#F87171":"#252015"}`,borderRadius:12,padding:"11px 13px",color:"#F0EDE8",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none"}}/>
                  {errors.buyQty && <div style={{color:"#F87171",fontSize:10,marginTop:3}}>{errors.buyQty}</div>}
                </div>
              </div>
              {form.buyPrice && form.buyQty && +form.buyPrice>0 && +form.buyQty>0 && (() => {
                const fxRate = form.buyCurrency==="EUR"?(1/EUR_RATE):form.buyCurrency==="GBP"?1.27:1;
                const totalInCur = form.priceMode==="unit"?+form.buyPrice * +form.buyQty:+form.buyPrice;
                const unitInCur  = form.priceMode==="unit"?+form.buyPrice:+form.buyPrice / +form.buyQty;
                const totalUSD   = totalInCur * fxRate;
                const unitUSD    = unitInCur  * fxRate;
                const sym = form.buyCurrency==="EUR"?"€":form.buyCurrency==="GBP"?"£":"$";
                return (
                  <div style={{marginTop:10,background:"#1A1714",borderRadius:10,padding:"10px 12px",border:"1px solid #252015",display:"flex",flexDirection:"column",gap:5}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{color:"#5A5550",fontSize:10,fontFamily:"'DM Mono',monospace"}}>Prix unitaire</span>
                      <span style={{color:"#F0EDE8",fontSize:11,fontFamily:"'DM Mono',monospace",fontWeight:600}}>{unitInCur.toFixed(2)}{sym} {form.buyCurrency!=="USD"&&<span style={{color:"#5A5550"}}>≈ ${unitUSD.toFixed(2)}</span>}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{color:"#5A5550",fontSize:10,fontFamily:"'DM Mono',monospace"}}>Coût total</span>
                      <span style={{color:"#C8A96E",fontSize:13,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{totalInCur.toFixed(2)}{sym} {form.buyCurrency!=="USD"&&<span style={{color:"#5A5550",fontSize:10}}>≈ ${totalUSD.toFixed(2)}</span>}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div style={{background:"#111009",borderRadius:14,padding:"14px",border:"1px solid #1E1B16"}}>
              <div style={{color:"#5A5550",fontSize:9,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>Couleur</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {ASSET_COLORS.map(c=>(
                  <button key={c} onClick={()=>set("color",c)} style={{width:28,height:28,borderRadius:8,background:c,border:"none",cursor:"pointer",outline:form.color===c?`3px solid ${c}`:"3px solid transparent",outlineOffset:2,transition:"outline 0.15s"}}/>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:2}}>
              <button onClick={()=>setStep(0)} style={{flex:1,background:"#111009",border:"1px solid #252015",borderRadius:14,padding:"13px",color:"#8B8580",fontSize:13,fontWeight:600,cursor:"pointer"}}>← Retour</button>
              <button onClick={submit} style={{flex:2,background:"linear-gradient(135deg,#C8A96E,#A08040)",border:"none",borderRadius:14,padding:"13px",color:"#111009",fontSize:14,fontWeight:700,cursor:"pointer"}}>Ajouter l'actif</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddDividendModal({ asset, onClose, onAdd }) {
  const [form, setForm] = useState({ date:"", amount:"", perShare:"" });
  const [errors, setErrors] = useState({});
  const validate = () => {
    const e = {};
    if(!form.date) e.date="Requis";
    if(!form.amount||isNaN(+form.amount)||+form.amount<=0) e.amount="Montant positif requis";
    setErrors(e); return Object.keys(e).length===0;
  };
  const submit = () => { if(!validate()) return; onAdd({ id:Date.now(), date:form.date, amount:+form.amount, perShare:+form.perShare||0 }); onClose(); };
  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"#000000AA",backdropFilter:"blur(6px)"}}>
      <div className="fadein" style={{width:390,background:"#1A1714",borderRadius:"28px 28px 0 0",padding:"24px 24px 40px",border:"1px solid #2A2520",borderBottom:"none"}}>
        <div style={{width:36,height:4,borderRadius:2,background:"#3A3530",margin:"0 auto 20px"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div>
            <div style={{color:"#F0EDE8",fontSize:18,fontWeight:700}}>Ajouter un dividende</div>
            <div style={{color:"#5A5550",fontSize:12,marginTop:2}}>{asset.symbol} · {asset.name}</div>
          </div>
          <button onClick={onClose} style={{background:"#252015",border:"none",width:32,height:32,borderRadius:10,cursor:"pointer",color:"#8B8580",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {[["date","Date de réception","date"],["amount","Montant total reçu (USD)","number"],["perShare","Par action / unité (USD)","number"]].map(([key,label,type])=>(
            <div key={key}>
              <div style={{color:"#8B8580",fontSize:11,marginBottom:6,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>{label}</div>
              <input type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{width:"100%",background:"#111009",border:`1px solid ${errors[key]?"#F87171":"#252015"}`,borderRadius:12,padding:"12px 14px",color:"#F0EDE8",fontSize:14,fontFamily:"'DM Mono',monospace",outline:"none"}}/>
              {errors[key]&&<div style={{color:"#F87171",fontSize:11,marginTop:4}}>{errors[key]}</div>}
            </div>
          ))}
          <button onClick={submit} style={{background:"#4ADE80",border:"none",borderRadius:14,padding:"13px",color:"#111009",fontSize:14,fontWeight:700,cursor:"pointer",marginTop:4}}>Enregistrer le dividende</button>
        </div>
      </div>
    </div>
  );
}

function AddTransactionModal({ asset, fmt, onClose, onAdd }) {
  const today = new Date().toISOString().slice(0,10);
  const nowTime = new Date().toTimeString().slice(0,5);
  const [form, setForm] = useState({ type:"buy", date:today, time:nowTime, qty:"", price:"", currency:"USD", priceMode:"unit" });
  const [errors, setErrors] = useState({});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const validate = () => {
    const e = {};
    if (!form.date) e.date = "Requis";
    if (!form.qty || isNaN(+form.qty) || +form.qty <= 0) e.qty = "Quantité positive requise";
    if (!form.price || isNaN(+form.price) || +form.price <= 0) e.price = "Prix positif requis";
    setErrors(e); return !Object.keys(e).length;
  };
  const submit = () => {
    if (!validate()) return;
    const fxRate = form.currency==="EUR"?(1/EUR_RATE):form.currency==="GBP"?1.27:1;
    const unitPriceInCur = form.priceMode==="total" ? +form.price / +form.qty : +form.price;
    const priceUSD = unitPriceInCur * fxRate;
    onAdd({ id: Date.now(), type: form.type, date: form.date, time: form.time, qty: +form.qty, priceOriginal: unitPriceInCur, currency: form.currency, priceUSD, priceMode: form.priceMode });
    onClose();
  };
  const sym = form.currency==="EUR"?"€":form.currency==="GBP"?"£":"$";
  const unitPrice = form.priceMode==="total" && +form.qty>0 ? +form.price / +form.qty : +form.price;
  const totalAmt = form.priceMode==="unit" ? unitPrice * +form.qty : +form.price;
  const showRecap = +form.qty > 0 && +form.price > 0;
  return (
    <div style={{position:"fixed",inset:0,zIndex:3000,background:"#000b",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{width:"100%",maxWidth:430,background:"#1A1714",borderRadius:"24px 24px 0 0",padding:"0 0 calc(32px + env(safe-area-inset-bottom,0px))",border:"1px solid #2A2520",boxShadow:"0 -8px 32px #000d",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:40,height:4,borderRadius:2,background:"#3A3530",margin:"12px auto 16px"}}/>
        <div style={{padding:"0 20px 4px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div style={{color:"#F0EDE8",fontSize:17,fontWeight:700}}>Ajouter une transaction</div>
            <button onClick={onClose} style={{background:"#252015",border:"none",width:32,height:32,borderRadius:10,cursor:"pointer",color:"#8B8580",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
          {/* Type achat/vente */}
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            {[["buy","Achat","#4ADE80"],["sell","Vente","#F87171"]].map(([v,l,c])=>(
              <button key={v} onClick={()=>set("type",v)} style={{flex:1,padding:"11px",border:`1px solid ${form.type===v?c+"60":"#252015"}`,borderRadius:12,background:form.type===v?c+"15":"#0E0D0A",color:form.type===v?c:"#5A5550",fontSize:14,fontWeight:form.type===v?700:500,cursor:"pointer",transition:"all 0.2s"}}>
                {form.type===v?(v==="buy"?"▲ ":"▼ "):""}{l}
              </button>
            ))}
          </div>
          {/* Date + Heure */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div>
              <div style={{color:"#6A6560",fontSize:10,marginBottom:5,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>Date</div>
              <input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={{width:"100%",background:"#0E0D0A",border:`1px solid ${errors.date?"#F87171":"#252015"}`,borderRadius:12,padding:"11px 13px",color:"#F0EDE8",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none"}}/>
              {errors.date&&<div style={{color:"#F87171",fontSize:10,marginTop:3}}>{errors.date}</div>}
            </div>
            <div>
              <div style={{color:"#6A6560",fontSize:10,marginBottom:5,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>Heure</div>
              <input type="time" value={form.time} onChange={e=>set("time",e.target.value)} style={{width:"100%",background:"#0E0D0A",border:"1px solid #252015",borderRadius:12,padding:"11px 13px",color:"#F0EDE8",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none"}}/>
            </div>
          </div>
          {/* Devise */}
          <div style={{marginBottom:12}}>
            <div style={{color:"#6A6560",fontSize:10,marginBottom:5,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>Devise</div>
            <div style={{display:"flex",gap:6}}>
              {[["USD","$"],["EUR","€"],["GBP","£"]].map(([cur,s])=>(
                <button key={cur} onClick={()=>set("currency",cur)} style={{flex:1,padding:"9px 0",border:`1px solid ${form.currency===cur?"#C8A96E60":"#252015"}`,borderRadius:10,background:form.currency===cur?"#C8A96E15":"#0E0D0A",color:form.currency===cur?"#C8A96E":"#5A5550",fontSize:12,fontWeight:form.currency===cur?700:500,cursor:"pointer",fontFamily:"'DM Mono',monospace",transition:"all 0.2s"}}>{s} {cur}</button>
              ))}
            </div>
          </div>
          {/* Type de prix */}
          <div style={{marginBottom:12}}>
            <div style={{color:"#6A6560",fontSize:10,marginBottom:5,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>Type de prix saisi</div>
            <div style={{display:"flex",gap:6}}>
              {[["unit","Par unité"],["total","Montant total"]].map(([mode,label])=>(
                <button key={mode} onClick={()=>set("priceMode",mode)} style={{flex:1,padding:"9px 0",border:`1px solid ${form.priceMode===mode?"#C8A96E60":"#252015"}`,borderRadius:10,background:form.priceMode===mode?"#C8A96E15":"#0E0D0A",color:form.priceMode===mode?"#C8A96E":"#5A5550",fontSize:12,fontWeight:form.priceMode===mode?700:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.2s"}}>{label}</button>
              ))}
            </div>
          </div>
          {/* Quantité + Prix */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div>
              <div style={{color:"#6A6560",fontSize:10,marginBottom:5,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>Quantité</div>
              <input type="number" value={form.qty} onChange={e=>set("qty",e.target.value)} placeholder="ex: 0.5" style={{width:"100%",background:"#0E0D0A",border:`1px solid ${errors.qty?"#F87171":"#252015"}`,borderRadius:12,padding:"11px 13px",color:"#F0EDE8",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none"}}/>
              {errors.qty&&<div style={{color:"#F87171",fontSize:10,marginTop:3}}>{errors.qty}</div>}
            </div>
            <div>
              <div style={{color:"#6A6560",fontSize:10,marginBottom:5,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>{form.priceMode==="unit"?`Prix unitaire (${form.currency})`:`Montant total (${form.currency})`}</div>
              <input type="number" value={form.price} onChange={e=>set("price",e.target.value)} placeholder={form.priceMode==="unit"?"ex: 189.30":"ex: 1893.00"} style={{width:"100%",background:"#0E0D0A",border:`1px solid ${errors.price?"#F87171":"#252015"}`,borderRadius:12,padding:"11px 13px",color:"#F0EDE8",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none"}}/>
              {errors.price&&<div style={{color:"#F87171",fontSize:10,marginTop:3}}>{errors.price}</div>}
            </div>
          </div>
          {/* Récap total */}
          {showRecap && (
            <div style={{background:"#111009",borderRadius:10,padding:"10px 13px",border:"1px solid #252015",marginBottom:16,display:"flex",flexDirection:"column",gap:5}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{color:"#5A5550",fontSize:11,fontFamily:"'DM Mono',monospace"}}>Prix unitaire</span>
                <span style={{color:"#F0EDE8",fontSize:12,fontWeight:600,fontFamily:"'DM Mono',monospace"}}>{unitPrice.toFixed(2)}{sym}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{color:"#5A5550",fontSize:11,fontFamily:"'DM Mono',monospace"}}>Montant total</span>
                <span style={{color:"#C8A96E",fontSize:14,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{totalAmt.toFixed(2)}{sym}</span>
              </div>
            </div>
          )}
          <button onClick={submit} style={{width:"100%",background:form.type==="buy"?"linear-gradient(135deg,#4ADE80,#22C55E)":"linear-gradient(135deg,#F87171,#EF4444)",border:"none",borderRadius:14,padding:"13px",color:"#111009",fontSize:14,fontWeight:700,cursor:"pointer"}}>
            {form.type==="buy"?"▲ Enregistrer l'achat":"▼ Enregistrer la vente"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssetDetailSheet({ asset, fmt, onClose, onAddDividend, onDelete, onAddTransaction, onDeleteTransaction }) {
  const [divModal, setDivModal] = useState(false);
  const [txModal, setTxModal] = useState(false);
  const [scale, setScale] = useState("1M");
  const isCrypto = asset.type === "crypto";
  const info = getAssetInfo(asset.symbol);
  const totalDivs = asset.dividends.reduce((s,d) => s+d.amount, 0);
  const chartData  = asset.histories?.[scale] || [asset.price];
  const chartFirst = chartData[0];
  const chartLast  = chartData[chartData.length - 1];
  const chartPct   = ((chartLast - chartFirst) / chartFirst * 100);
  const chartPos   = chartPct >= 0;
  const chartAmtRaw = (chartLast - chartFirst) * asset.qty;
  const w = 310, h = 110;
  const min = Math.min(...chartData), max = Math.max(...chartData), range = max - min || 1;
  const pts = chartData.map((v,i) => {
    const x = (i / (chartData.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 10) - 5;
    return `${x},${y}`;
  }).join(" ");
  const uid = (asset.color + scale).replace(/[#.\s]/g, "x");
  return (
    <>
      <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"#000000BB",backdropFilter:"blur(6px)"}}>
        <div className="fadein" style={{width:390,background:"#151210",borderRadius:"28px 28px 0 0",border:"1px solid #2A2520",borderBottom:"none",maxHeight:"92vh",overflowY:"auto",paddingBottom:40}}>
          <div style={{width:36,height:4,borderRadius:2,background:"#3A3530",margin:"16px auto 0"}}/>
          <div style={{padding:"14px 20px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:46,height:46,borderRadius:15,background:`${asset.color}18`,border:`1px solid ${asset.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:asset.color,fontFamily:"'DM Mono',monospace"}}>{asset.symbol.slice(0,2)}</div>
              <div>
                <div style={{color:"#F0EDE8",fontWeight:700,fontSize:17,fontFamily:"'DM Mono',monospace"}}>{asset.symbol} {info.country}</div>
                <div style={{color:"#5A5550",fontSize:12,marginTop:1}}>{asset.name}</div>
              </div>
            </div>
            <button onClick={onClose} style={{background:"#252015",border:"none",width:34,height:34,borderRadius:10,cursor:"pointer",color:"#8B8580",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
          <div style={{padding:"12px 20px 0"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:30,fontWeight:700,color:"#F0EDE8",letterSpacing:-1}}>{fmt(asset.price,2)}</div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
              <div style={{background:chartPos?"#4ADE8018":"#F8717118",border:`1px solid ${chartPos?"#4ADE8035":"#F8717135"}`,borderRadius:10,padding:"4px 10px",display:"flex",alignItems:"center",gap:5}}>
                <span style={{color:chartPos?"#4ADE80":"#F87171",fontSize:12,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{chartPos?"▲":"▼"} {chartPos?"+":"-"}{fmt(Math.abs(chartAmtRaw),2)}</span>
              </div>
              <div style={{background:"#1A1714",border:"1px solid #252015",borderRadius:10,padding:"4px 10px"}}>
                <span style={{color:chartPos?"#4ADE80":"#F87171",fontSize:12,fontFamily:"'DM Mono',monospace",fontWeight:600}}>{chartPos?"+":""}{chartPct.toFixed(2)}%</span>
              </div>
              <span style={{color:"#3A3530",fontSize:10,fontFamily:"'DM Mono',monospace"}}>sur {scale}</span>
            </div>
          </div>
          <div style={{margin:"14px 20px 0"}}>
            <div style={{display:"flex",gap:4,marginBottom:10,background:"#1A1714",borderRadius:14,padding:4}}>
              {TIME_SCALES.map(ts=>(
                <button key={ts.label} onClick={()=>setScale(ts.label)} style={{flex:1,padding:"6px 0",border:scale===ts.label?`1px solid ${asset.color}35`:"1px solid transparent",cursor:"pointer",background:scale===ts.label?`${asset.color}20`:"transparent",color:scale===ts.label?asset.color:"#4A4540",borderRadius:10,fontSize:10,fontWeight:scale===ts.label?700:500,fontFamily:"'DM Mono',monospace",transition:"all 0.2s"}}>{ts.label}</button>
              ))}
            </div>
            <div style={{background:"#111009",borderRadius:16,padding:"12px 6px 8px",border:`1px solid ${asset.color}18`}}>
              <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:"block"}}>
                <defs>
                  <linearGradient id={`ds${uid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={asset.color} stopOpacity={chartPos?"0.4":"0.15"}/>
                    <stop offset="100%" stopColor={asset.color} stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {[0.25,0.5,0.75].map(p=><line key={p} x1={0} y1={h*p} x2={w} y2={h*p} stroke="#ffffff05" strokeWidth="1"/>)}
                <polygon points={`${pts} ${w},${h} 0,${h}`} fill={`url(#ds${uid})`}/>
                <polyline points={pts} fill="none" stroke={asset.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                {(()=>{ const lastX=w, lastY=h-((chartLast-min)/range)*(h-10)-5; return <><circle cx={lastX} cy={lastY} r="4" fill={asset.color}/><circle cx={lastX} cy={lastY} r="7" fill={asset.color} opacity="0.2"/></>; })()}
              </svg>
              <div style={{display:"flex",justifyContent:"space-between",padding:"3px 8px 0",fontFamily:"'DM Mono',monospace",color:"#3A3530",fontSize:9}}>
                <span>{fmt(min,0)}</span><span>{fmt(max,0)}</span>
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,padding:"12px 20px 0"}}>
            {[["Secteur",info.sector],["Bourse",info.exchange],["Pays",info.country||"—"],["Rdt. div.",info.yield],["Bêta",info.beta],["Type",asset.type==="etf"?"ETF":asset.type==="crypto"?"Crypto":"Action"]].map(([k,v])=>(
              <div key={k} style={{background:"#1A1714",borderRadius:11,padding:"9px 11px",border:"1px solid #252015"}}>
                <div style={{color:"#4A4540",fontSize:9,marginBottom:3,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:0.5}}>{k}</div>
                <div style={{color:"#F0EDE8",fontWeight:600,fontSize:11,fontFamily:"'DM Mono',monospace"}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{margin:"12px 20px 0",background:"#1A1714",borderRadius:14,padding:"12px 14px",border:"1px solid #252015"}}>
            <div style={{color:"#5A5550",fontSize:9,marginBottom:5,fontFamily:"'DM Mono',monospace",letterSpacing:1,textTransform:"uppercase"}}>À propos</div>
            <div style={{color:"#8A8480",fontSize:12,lineHeight:1.7}}>{info.description}</div>
          </div>
          <div style={{margin:"12px 20px 0",background:"linear-gradient(135deg,#1E1A12,#252015)",borderRadius:14,padding:"12px 14px",border:"1px solid #3A3018"}}>
            <div style={{color:"#6A5A30",fontSize:9,marginBottom:10,fontFamily:"'DM Mono',monospace",letterSpacing:1,textTransform:"uppercase"}}>Ma position</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                ["Quantité", `${asset.qty} ${asset.symbol}`],
                ["Valeur actuelle", fmt(asset.qty * asset.price, 0)],
                ["Prix d'achat", (() => {
                  if (!asset.purchase) return fmt(asset.price, 2);
                  const px  = asset.purchase.priceOriginal ?? asset.purchase.priceUSD ?? asset.purchase.price;
                  const cur = asset.purchase.currency ?? "USD";
                  const sym = cur === "EUR" ? "€" : cur === "GBP" ? "£" : "$";
                  return isNaN(px) ? fmt(asset.price, 2) : `${px.toFixed(2)} ${sym}`;
                })()],
                ["P&L", (() => {
                  const buyPx = asset.purchase?.priceOriginal ?? asset.purchase?.priceUSD ?? asset.purchase?.price;
                  const pnl = buyPx ? (asset.price - buyPx) * asset.qty : chartAmtRaw;
                  const pnlPct = buyPx ? ((asset.price - buyPx) / buyPx * 100) : chartPct;
                  return <span style={{color:pnl>=0?"#4ADE80":"#F87171"}}>{pnl>=0?"▲ ":"▼ "}{fmt(Math.abs(pnl),2)} ({pnlPct>=0?"+":""}{pnlPct.toFixed(2)}%)</span>;
                })()],
              ].map(([k,v])=>(
                <div key={k}>
                  <div style={{color:"#5A4A30",fontSize:9,marginBottom:3,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:0.5}}>{k}</div>
                  <div style={{color:"#F0EDE8",fontWeight:700,fontSize:14,fontFamily:"'DM Mono',monospace"}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          {/* ── Transactions ── */}
          <div style={{margin:"12px 20px 0"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <div style={{color:"#F0EDE8",fontWeight:600,fontSize:13}}>Transactions</div>
                <div style={{color:"#5A5550",fontSize:11,fontFamily:"'DM Mono',monospace",marginTop:1}}>{(asset.transactions||[]).length} opération{(asset.transactions||[]).length!==1?"s":""}</div>
              </div>
              <button onClick={()=>setTxModal(true)} style={{background:"#1A1A2A",border:"1px solid #2A2A4A",borderRadius:11,padding:"7px 13px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:"#A3B8C2",fontSize:12,fontWeight:600}}>
                <span style={{fontSize:15,lineHeight:1}}>+</span> Ajouter
              </button>
            </div>
            {(!asset.transactions||asset.transactions.length===0) ? (
              <div style={{background:"#111009",borderRadius:14,padding:"18px",textAlign:"center",border:"1px dashed #252015"}}>
                <div style={{fontSize:22,marginBottom:5}}>📋</div>
                <div style={{color:"#4A4540",fontSize:12}}>Aucune transaction enregistrée</div>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {[...(asset.transactions||[])].reverse().map(tx=>{
                  const isBuy = tx.type==="buy";
                  const currentVal = tx.qty * asset.price;
                  const costVal = tx.qty * tx.priceUSD;
                  const pnl = isBuy ? currentVal - costVal : null;
                  const pnlPct = isBuy && costVal>0 ? ((currentVal-costVal)/costVal*100) : null;
                  const sym = tx.currency==="EUR"?"€":tx.currency==="GBP"?"£":"$";
                  return (
                    <div key={tx.id} style={{background:"#111009",borderRadius:14,padding:"12px 14px",border:`1px solid ${isBuy?"#4ADE8018":"#F8717118"}`}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:28,height:28,borderRadius:8,background:isBuy?"#4ADE8020":"#F8717120",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>
                            {isBuy?"▲":"▼"}
                          </div>
                          <div>
                            <div style={{color:isBuy?"#4ADE80":"#F87171",fontSize:12,fontWeight:700}}>{isBuy?"Achat":"Vente"}</div>
                            <div style={{color:"#4A4540",fontSize:10,fontFamily:"'DM Mono',monospace"}}>{tx.date}{tx.time?` · ${tx.time}`:""}</div>
                          </div>
                        </div>
                        <button onClick={()=>onDeleteTransaction(asset.id, tx.id)} style={{background:"transparent",border:"1px solid #2A2520",borderRadius:8,padding:"4px 9px",color:"#5A5550",fontSize:11,cursor:"pointer"}}>✕</button>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                        {[
                          ["Quantité", `${tx.qty} ${asset.symbol}`],
                          ["Prix d'achat", `${tx.priceOriginal?.toFixed(2)}${sym}`],
                          ["Valeur actuelle", fmt(currentVal, 2)],
                          isBuy ? ["P&L", <span style={{color:pnl>=0?"#4ADE80":"#F87171"}}>{pnl>=0?"▲ ":"▼ "}{fmt(Math.abs(pnl),2)} ({pnlPct>=0?"+":""}{pnlPct?.toFixed(2)}%)</span>] : ["Montant", fmt(costVal,2)],
                        ].map(([k,v],i)=>(
                          <div key={i} style={{background:"#0E0D0A",borderRadius:8,padding:"7px 10px",border:"1px solid #1E1B16"}}>
                            <div style={{color:"#4A4540",fontSize:9,marginBottom:2,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:0.5}}>{k}</div>
                            <div style={{color:"#F0EDE8",fontWeight:600,fontSize:12,fontFamily:"'DM Mono',monospace"}}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!isCrypto && (
            <div style={{margin:"12px 20px 0"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <div style={{color:"#F0EDE8",fontWeight:600,fontSize:13}}>Dividendes reçus</div>
                  <div style={{color:"#4ADE80",fontSize:11,fontFamily:"'DM Mono',monospace",marginTop:1}}>Total : {fmt(totalDivs,2)}</div>
                </div>
                <button onClick={()=>setDivModal(true)} style={{background:"#1A2A1A",border:"1px solid #2A4A2A",borderRadius:11,padding:"7px 13px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:"#4ADE80",fontSize:12,fontWeight:600}}>
                  <span style={{fontSize:15,lineHeight:1}}>+</span> Ajouter
                </button>
              </div>
              {asset.dividends.length===0 ? (
                <div style={{background:"#111009",borderRadius:14,padding:"18px",textAlign:"center",border:"1px dashed #252015"}}>
                  <div style={{fontSize:22,marginBottom:5}}>🌱</div>
                  <div style={{color:"#4A4540",fontSize:12}}>Aucun dividende enregistré</div>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {[...asset.dividends].reverse().map(d=>(
                    <div key={d.id} style={{background:"#111009",borderRadius:12,padding:"11px 13px",border:"1px solid #1E1B16",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:30,height:30,borderRadius:9,background:"#1A2A1A",border:"1px solid #2A3A2A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>💰</div>
                        <div>
                          <div style={{color:"#F0EDE8",fontWeight:600,fontSize:13,fontFamily:"'DM Mono',monospace"}}>{fmt(d.amount,2)}</div>
                          <div style={{color:"#4A4540",fontSize:10,marginTop:1}}>{d.date}{d.perShare>0&&` · ${fmt(d.perShare,4)}/action`}</div>
                        </div>
                      </div>
                      <div style={{background:"#4ADE8015",border:"1px solid #4ADE8030",borderRadius:8,padding:"3px 9px"}}>
                        <span style={{color:"#4ADE80",fontSize:11,fontFamily:"'DM Mono',monospace",fontWeight:600}}>{fmt(d.amount,2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{padding:"14px 20px 0"}}>
            <button onClick={()=>{onDelete(asset.id);onClose();}} style={{width:"100%",background:"transparent",border:"1px solid #3A1A1A",borderRadius:14,padding:"12px",color:"#F87171",fontSize:13,fontWeight:600,cursor:"pointer"}}>
              Supprimer cet actif
            </button>
          </div>
        </div>
      </div>
      {divModal && <AddDividendModal asset={asset} onClose={()=>setDivModal(false)} onAdd={(div)=>{onAddDividend(asset.id,div);setDivModal(false);}}/>}
      {txModal && <AddTransactionModal asset={asset} fmt={fmt} onClose={()=>setTxModal(false)} onAdd={(tx)=>{onAddTransaction(asset.id,tx);setTxModal(false);}}/>}
    </>
  );
}

function AccIcon({ type, color }) {
  if (type === "savings") return <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 2a5 5 0 00-5 5v1H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V10a2 2 0 00-2-2h-2V7a5 5 0 00-5-5z" stroke={color} strokeWidth="1.7"/><circle cx="12" cy="15" r="2" fill={color} opacity="0.7"/></svg>;
  if (type === "credit") return <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.7"/><path d="M2 9h20" stroke={color} strokeWidth="1.7"/><circle cx="7" cy="14" r="1.5" fill={color} opacity="0.7"/></svg>;
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="14" rx="2" stroke={color} strokeWidth="1.7"/><path d="M2 10h20" stroke={color} strokeWidth="1.7"/><path d="M6 15h4" stroke={color} strokeWidth="1.7" strokeLinecap="round"/></svg>;
}

function BankCard({ bank, onRemove, expandedAccount, setExpandedAccount }) {
  const [isOpen, setIsOpen] = useState(true);
  const fmtEur = (v, dec=2) => v.toLocaleString("fr-FR", { minimumFractionDigits:dec, maximumFractionDigits:dec }) + " €";
  const bankTotal = bank.accounts.reduce((s,a) => s + a.balance, 0);
  return (
    <div style={{margin:"0 20px 12px",borderRadius:20,border:`1px solid ${bank.color}25`,overflow:"hidden",background:"#111009"}}>
      <div className="asset-row" onClick={()=>setIsOpen(o=>!o)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",background:isOpen?`${bank.color}0A`:"transparent",borderBottom:isOpen?`1px solid ${bank.color}18`:"none",cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:13,background:`${bank.color}18`,border:`1px solid ${bank.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:bank.color,fontFamily:"'DM Mono',monospace",flexShrink:0}}>{bank.logo}</div>
          <div>
            <div style={{color:"#F0EDE8",fontWeight:700,fontSize:15}}>{bank.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
              <div style={{width:5,height:5,borderRadius:3,background:"#4ADE80"}}/>
              <span style={{color:"#3A5A40",fontSize:10,fontFamily:"'DM Mono',monospace"}}>Connecté via Tink</span>
              <span style={{color:"#2A3530",fontSize:10,fontFamily:"'DM Mono',monospace"}}>· {bank.accounts.length} compte{bank.accounts.length>1?"s":""}</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontFamily:"'DM Mono',monospace",color:"#F0EDE8",fontWeight:700,fontSize:15}}>{fmtEur(bankTotal,0)}</div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{transform:isOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.3s",flexShrink:0}}>
            <path d="M6 9l6 6 6-6" stroke={bank.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      {isOpen && (
        <div>
          <div style={{display:"flex",borderBottom:"1px solid #1A1714",overflowX:"auto",padding:"0 16px",gap:2}}>
            {bank.accounts.map(acc => {
              const isActiveTab = expandedAccount === acc.id;
              return <button key={acc.id} onClick={e=>{e.stopPropagation();setExpandedAccount(isActiveTab?null:acc.id);}} style={{padding:"10px 14px",border:"none",background:"transparent",cursor:"pointer",color:isActiveTab?bank.color:"#4A4540",fontSize:12,fontWeight:isActiveTab?700:500,fontFamily:"'DM Sans',sans-serif",borderBottom:isActiveTab?`2px solid ${bank.color}`:"2px solid transparent",marginBottom:"-1px",whiteSpace:"nowrap",transition:"all 0.2s",flexShrink:0}}>{acc.label}</button>;
            })}
          </div>
          {bank.accounts.map(acc => {
            if (expandedAccount !== acc.id) return null;
            const trend = acc.history[acc.history.length-1] - acc.history[0];
            return (
              <div key={acc.id} style={{padding:"14px 16px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:12}}>
                  <div>
                    <div style={{color:"#3A5A40",fontSize:9,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:4}}>Solde actuel</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:26,fontWeight:700,color:"#F0EDE8",letterSpacing:-0.5}}>{fmtEur(acc.balance)}</div>
                  </div>
                  <div style={{background:trend>=0?"#4ADE8015":"#F8717115",border:`1px solid ${trend>=0?"#4ADE8030":"#F8717130"}`,color:trend>=0?"#4ADE80":"#F87171",borderRadius:10,padding:"5px 11px",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700}}>
                    {trend>=0?"▲":"▼"} {fmtEur(Math.abs(trend),0)} / mois
                  </div>
                </div>
                <div style={{background:"#0A1209",borderRadius:14,padding:"12px 8px 8px",border:`1px solid ${bank.color}18`,marginBottom:10}}>
                  <MiniChart data={acc.history} color={bank.color} w={318} h={72} strokeWidth={2.5} showDots/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                  {[["Type",ACCOUNT_TYPE_LABEL[acc.type]],["Banque",bank.name]].map(([k,v])=>(
                    <div key={k} style={{background:"#0E0E0A",borderRadius:10,padding:"9px 12px",border:"1px solid #1A1714"}}>
                      <div style={{color:"#3A3530",fontSize:9,marginBottom:3,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>{k}</div>
                      <div style={{fontFamily:"'DM Mono',monospace",color:"#F0EDE8",fontSize:12,fontWeight:600}}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:"#0E0E0A",borderRadius:10,padding:"9px 13px",border:"1px solid #1A1714"}}>
                  <div style={{color:"#3A3530",fontSize:9,marginBottom:3,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>IBAN</div>
                  <div style={{fontFamily:"'DM Mono',monospace",color:"#6A6560",fontSize:11,letterSpacing:0.8}}>{acc.iban}</div>
                </div>
              </div>
            );
          })}
          {!bank.accounts.some(a=>a.id===expandedAccount) && (
            <div>
              {bank.accounts.map(acc=>{
                const trend = acc.history[acc.history.length-1] - acc.history[0];
                return (
                  <div key={acc.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",borderTop:"1px solid #191612"}}>
                    <div style={{width:34,height:34,borderRadius:10,background:`${bank.color}12`,border:`1px solid ${bank.color}20`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <AccIcon type={acc.type} color={bank.color}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{color:"#F0EDE8",fontWeight:600,fontSize:13}}>{acc.label}</div>
                      <div style={{color:"#4A4540",fontSize:10,marginTop:1,fontFamily:"'DM Mono',monospace"}}>{ACCOUNT_TYPE_LABEL[acc.type]}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontFamily:"'DM Mono',monospace",color:"#F0EDE8",fontWeight:700,fontSize:13}}>{fmtEur(acc.balance)}</div>
                      <div style={{color:trend>=0?"#4ADE80":"#F87171",fontSize:10,fontFamily:"'DM Mono',monospace",marginTop:1}}>{trend>=0?"▲":"▼"} {fmtEur(Math.abs(trend),0)}</div>
                    </div>
                    <MiniChart data={acc.history} color={bank.color} w={54} h={22}/>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {isOpen && (
        <div style={{padding:"10px 16px",borderTop:`1px solid ${bank.color}12`}}>
          <button onClick={e=>{e.stopPropagation();onRemove(bank.id);}} style={{background:"transparent",border:"1px solid #2A2520",borderRadius:10,padding:"6px 14px",color:"#5A5550",fontSize:10,cursor:"pointer",width:"100%",fontFamily:"'DM Sans',sans-serif"}}>
            Déconnecter {bank.name}
          </button>
        </div>
      )}
    </div>
  );
}

function BankTab({ banks, onRemove, expandedAccount, setExpandedAccount }) {
  const fmtEur = (v,dec=2) => v.toLocaleString("fr-FR",{minimumFractionDigits:dec,maximumFractionDigits:dec})+" €";
  const totalBalance = banks.flatMap(b=>b.accounts).reduce((s,a)=>s+a.balance,0);
  return (
    <div className="fadein">
      <div style={{margin:"0 20px 16px",background:"linear-gradient(135deg,#0E1A14,#122018,#0C1810)",borderRadius:22,padding:"18px 20px",border:"1px solid #1E3A28",position:"relative",overflow:"hidden"}}>
        <div style={{color:"#3A6A50",fontSize:10,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:6}}>Total bancaire</div>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:30,fontWeight:700,color:"#F0EDE8",letterSpacing:-1}}>{fmtEur(totalBalance)}</div>
        <div style={{display:"flex",gap:10,marginTop:10,flexWrap:"wrap"}}>
          {banks.map(b=>{
            const bTotal=b.accounts.reduce((s,a)=>s+a.balance,0);
            return (
              <div key={b.id} style={{display:"flex",alignItems:"center",gap:5,background:`${b.color}12`,borderRadius:10,padding:"4px 10px",border:`1px solid ${b.color}20`}}>
                <div style={{width:6,height:6,borderRadius:3,background:b.color}}/>
                <span style={{color:b.color,fontSize:10,fontFamily:"'DM Mono',monospace",fontWeight:600}}>{b.name.split(" ")[0]}</span>
                <span style={{color:"#5A7A60",fontSize:10,fontFamily:"'DM Mono',monospace"}}>{fmtEur(bTotal,0)}</span>
              </div>
            );
          })}
        </div>
      </div>
      {banks.map(bank=><BankCard key={bank.id} bank={bank} onRemove={onRemove} expandedAccount={expandedAccount} setExpandedAccount={setExpandedAccount}/>)}
      <div style={{margin:"4px 20px 0",padding:"16px",textAlign:"center"}}>
        <div style={{color:"#3A3530",fontSize:11,fontFamily:"'DM Mono',monospace"}}>Connexion bancaire — bientôt disponible</div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab]               = useState(0);
  const [assets, setAssets]         = useState([]);
  const [dbLoading, setDbLoading]   = useState(true);
  const [userId, setUserId]         = useState(null);
  const [user, setUser]             = useState(null);
  const [authMode, setAuthMode]     = useState("login");
  const [authEmail, setAuthEmail]   = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError]   = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [chartAsset, setChartAsset] = useState(null);
  const [currency, setCurrency]     = useState("EUR");
  const [viewMode, setViewMode]     = useState("grouped");
  const [mktFilter, setMktFilter]   = useState("all");
  const [banks, setBanks]           = useState(MOCK_BANKS);
  const [expandedAcc, setExpandedAcc] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailAsset, setDetailAsset]   = useState(null);
  const [listScale, setListScale]       = useState("1M");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showSettings, setShowSettings]       = useState(false);
  const [sessionDuration, setSessionDuration] = useState("always");
  const [rememberMe, setRememberMe] = useState(true);
  const [portfolios, setPortfolios]           = useState([{id:"default", name:"Mon Portefeuille"}]);
  const [activePortfolioId, setActivePortfolioId] = useState("default");
  const [showAddPortfolio, setShowAddPortfolio]   = useState(false);
  const [newPortfolioName, setNewPortfolioName]   = useState("");
  const [editingPortfolioId, setEditingPortfolioId] = useState(null);
  const [editingPortfolioName, setEditingPortfolioName] = useState("");
  const [portfolioName, setPortfolioName]     = useState("Mon Portefeuille");
  const [profileName, setProfileName]         = useState("");
  const [editPortfolioName, setEditPortfolioName] = useState("");
  const [editProfileName, setEditProfileName]     = useState("");
  const [dragMode, setDragMode]         = useState(false);
  const [dragMktMode, setDragMktMode]   = useState(false);
  // ── Drag actifs (tout en refs pour éviter les problèmes de closure) ──
  const [assetDraggingIdx, setAssetDraggingIdx] = useState(null);
  const [assetDragOverIdx, setAssetDragOverIdx] = useState(null);
  const [assetGhostPos, setAssetGhostPos] = useState({x:0,y:0});
  const [assetGhostItem, setAssetGhostItem] = useState(null);
  const assetDragActive  = useRef(false);
  const assetDragFrom    = useRef(null);
  const assetDragTo      = useRef(null);
  const assetLongTimer   = useRef(null);
  const assetsListRef    = useRef(null);
  // ── Drag marchés ──
  const [mktDraggingIdx, setMktDraggingIdx] = useState(null);
  const [mktDragOverIdx, setMktDragOverIdx] = useState(null);
  const [mktGhostPos, setMktGhostPos] = useState({x:0, y:0});
  const [mktGhostItem, setMktGhostItem] = useState(null);
  const mktDragActive    = useRef(false);
  const mktDragFrom      = useRef(null);
  const mktDragTo        = useRef(null);
  const mktLongTimer     = useRef(null);
  const mktListRef       = useRef(null);
  // ── Drag HTML5 (PC) ──
  const dragItem         = useRef(null);
  const dragOverItem     = useRef(null);
  const dragMktItem      = useRef(null);
  const dragMktOverItem  = useRef(null);
  const swipeStartX      = useRef(0);

  // ── Helper commun : trouve l'index d'insertion selon position Y du doigt ──
  const getInsertIdx = (containerRef, clientY, dataAttr, listLength) => {
    const container = containerRef.current;
    if (!container) return listLength - 1;
    const items = container.querySelectorAll(`[${dataAttr}]`);
    // Trouver l'item le plus proche du doigt
    let closestIdx = listLength - 1;
    let closestDist = Infinity;
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const dist = Math.abs(clientY - mid);
      if (dist < closestDist) {
        closestDist = dist;
        // Si le doigt est dans la moitié haute → insérer avant (idx i)
        // Si le doigt est dans la moitié basse → insérer après (idx i+1)
        closestIdx = clientY < mid
          ? parseInt(items[i].getAttribute(dataAttr))
          : (i < items.length - 1 ? parseInt(items[i+1].getAttribute(dataAttr)) : listLength - 1);
      }
    }
    return closestIdx;
  };

  // ── Drag ACTIFS ──
  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const arr = [...assets];
    const dragged = arr.splice(dragItem.current, 1)[0];
    arr.splice(dragOverItem.current, 0, dragged);
    dragItem.current = null; dragOverItem.current = null;
    setAssets(arr);
  };

  const handleAssetTouchStart = (e, idx, asset) => {
    if (!dragMode) return;
    const touch = e.touches[0];
    assetLongTimer.current = setTimeout(() => {
      assetDragActive.current = true;
      assetDragFrom.current = idx;
      assetDragTo.current = idx;
      setAssetDraggingIdx(idx);
      setAssetDragOverIdx(null);
      setAssetGhostItem(asset);
      setAssetGhostPos({x: touch.clientX, y: touch.clientY});
      if (navigator.vibrate) navigator.vibrate(40);
    }, 250);
  };

  const handleAssetTouchMove = (e) => {
    if (!assetDragActive.current) { clearTimeout(assetLongTimer.current); return; }
    e.preventDefault();
    const touch = e.touches[0];
    setAssetGhostPos({x: touch.clientX, y: touch.clientY});
    const insertIdx = getInsertIdx(assetsListRef, touch.clientY, "data-asset-item", assets.length);
    assetDragTo.current = insertIdx;
    setAssetDragOverIdx(insertIdx !== assetDragFrom.current ? insertIdx : null);
  };

  const handleAssetTouchEnd = () => {
    clearTimeout(assetLongTimer.current);
    if (assetDragActive.current && assetDragFrom.current !== null && assetDragTo.current !== null && assetDragFrom.current !== assetDragTo.current) {
      const arr = [...assets];
      const dragged = arr.splice(assetDragFrom.current, 1)[0];
      arr.splice(assetDragTo.current, 0, dragged);
      setAssets(arr);
    }
    assetDragActive.current = false;
    assetDragFrom.current = null;
    assetDragTo.current = null;
    setAssetDraggingIdx(null);
    setAssetDragOverIdx(null);
    setAssetGhostItem(null);
  };

  // ── Drag MARCHÉS ──
  const handleDragMktSort = () => {
    if (dragMktItem.current === null || dragMktOverItem.current === null) return;
    const arr = [...allMarket];
    const dragged = arr.splice(dragMktItem.current, 1)[0];
    arr.splice(dragMktOverItem.current, 0, dragged);
    dragMktItem.current = null; dragMktOverItem.current = null;
    setAllMarket(arr);
  };

  const handleMktTouchStart = (e, realIdx) => {
    if (!dragMktMode) return;
    const touch = e.touches[0];
    mktLongTimer.current = setTimeout(() => {
      mktDragActive.current = true;
      mktDragFrom.current = realIdx;
      mktDragTo.current = realIdx;
      setMktDraggingIdx(realIdx);
      setMktDragOverIdx(null);
      setMktGhostItem(allMarket[realIdx]);
      setMktGhostPos({x: touch.clientX, y: touch.clientY});
      if (navigator.vibrate) navigator.vibrate(40);
    }, 250);
  };

  const handleMktTouchMove = (e) => {
    if (!mktDragActive.current) { clearTimeout(mktLongTimer.current); return; }
    e.preventDefault();
    const touch = e.touches[0];
    setMktGhostPos({x: touch.clientX, y: touch.clientY});
    const insertIdx = getInsertIdx(mktListRef, touch.clientY, "data-mkt-item", allMarket.length);
    mktDragTo.current = insertIdx;
    setMktDragOverIdx(insertIdx !== mktDragFrom.current ? insertIdx : null);
  };

  const handleMktTouchEnd = () => {
    clearTimeout(mktLongTimer.current);
    if (mktDragActive.current && mktDragFrom.current !== null && mktDragTo.current !== null && mktDragFrom.current !== mktDragTo.current) {
      const arr = [...allMarket];
      const dragged = arr.splice(mktDragFrom.current, 1)[0];
      arr.splice(mktDragTo.current, 0, dragged);
      setAllMarket(arr);
    }
    mktDragActive.current = false;
    mktDragFrom.current = null;
    mktDragTo.current = null;
    setMktDraggingIdx(null);
    setMktDragOverIdx(null);
    setMktGhostItem(null);
  };


  const DEFAULT_MARKET = [
    { symbol:"BTC",  name:"Bitcoin",   price:68420, change: 2.34, color:"#F7931A", type:"crypto" },
    { symbol:"ETH",  name:"Ethereum",  price:3812,  change:-1.12, color:"#627EEA", type:"crypto" },
    { symbol:"SOL",  name:"Solana",    price:178.6, change:-3.5,  color:"#9945FF", type:"crypto" },
    { symbol:"AAPL", name:"Apple",     price:189.3, change: 0.87, color:"#A3B8C2", type:"stock"  },
    { symbol:"NVDA", name:"NVIDIA",    price:875.4, change: 4.21, color:"#76B900", type:"stock"  },
    { symbol:"TSLA", name:"Tesla",     price:246.8, change:-0.43, color:"#CC0000", type:"stock"  },
    { symbol:"MSFT", name:"Microsoft", price:415.2, change: 1.05, color:"#00A4EF", type:"stock"  },
    { symbol:"XRP",  name:"Ripple",    price:0.62,  change: 6.4,  color:"#346AA9", type:"crypto" },
  ];
  const loadMarket = () => {
    try {
      const saved = localStorage.getItem("market_watchlist");
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return DEFAULT_MARKET;
  };
  const [allMarket, setAllMarket] = useState(loadMarket);

  const [showMktAdd, setShowMktAdd]       = useState(false);
  const [mktAddSymbol, setMktAddSymbol]   = useState("");
  const [mktAddLoading, setMktAddLoading] = useState(false);
  const [mktAddError, setMktAddError]     = useState("");

  const handleAddMarket = async () => {
    const sym = mktAddSymbol.trim().toUpperCase();
    if (!sym) return;
    if (allMarket.find(a => a.symbol === sym)) { setMktAddError("Déjà dans la liste"); return; }
    setMktAddLoading(true); setMktAddError("");
    try {
      const isCrypto = CRYPTO_SYMBOLS.includes(sym);
      const endpoint = isCrypto ? `/api/prices/crypto?symbols=${sym}` : `/api/prices/stocks?symbols=${sym}`;
      const res  = await fetch(endpoint);
      const data = await res.json();
      const p    = data[sym];
      if (p && p.price) {
        setAllMarket(prev => [...prev, { symbol:sym, name:sym, price:p.price, change:p.change24h??0, color:ASSET_COLORS[prev.length%ASSET_COLORS.length], type:isCrypto?"crypto":"stock" }]);
        setMktAddSymbol(""); setShowMktAdd(false);
      } else { setMktAddError("Symbole introuvable"); }
    } catch(e) { setMktAddError("Erreur de connexion"); }
    setMktAddLoading(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Supabase : charger profil + portefeuilles (MIGRATION localStorage → Supabase)
  // ═══════════════════════════════════════════════════════════════════════════
  const loadUserData = async (uid) => {
    // 1. Profil
    try {
      const { data: profileData } = await supabase
        .from('profiles').select('display_name, session_duration').eq('id', uid).single();
      if (profileData) {
        setProfileName(profileData.display_name || '');
        if (profileData.session_duration) setSessionDuration(profileData.session_duration);
      } else {
        await supabase.from('profiles').insert({ id: uid, display_name: '' });
        setProfileName('');
      }
    } catch(e) {
      try { await supabase.from('profiles').insert({ id: uid, display_name: '' }); } catch {}
      setProfileName('');
    }
    // 2. Portefeuilles
    try {
      const { data: portfoliosData } = await supabase
        .from('portfolios').select('id, name').eq('user_id', uid)
        .order('created_at', { ascending: true });
      if (portfoliosData && portfoliosData.length > 0) {
        setPortfolios(portfoliosData);
        setActivePortfolioId(portfoliosData[0].id);
        setPortfolioName(portfoliosData[0].name);
        return portfoliosData[0].id;
      } else {
        const def = { id: 'default', name: 'Mon Portefeuille' };
        await supabase.from('portfolios').insert({ ...def, user_id: uid });
        setPortfolios([def]);
        setActivePortfolioId('default');
        setPortfolioName('Mon Portefeuille');
        return 'default';
      }
    } catch(e) { console.error('loadPortfolios:', e); return 'default'; }
  };

  const saveProfileNameToDB = async (name, uid) => {
    try {
      await supabase.from('profiles')
        .upsert({ id: uid, display_name: name, updated_at: new Date().toISOString() });
    } catch(e) { console.error('saveProfileName:', e); }
  };

  const createPortfolio = async (name, uid) => {
    const id = Date.now().toString();
    try {
      await supabase.from('portfolios').insert({ id, name, user_id: uid });
      setPortfolios(prev => [...prev, { id, name }]);
    } catch(e) { console.error('createPortfolio:', e); }
  };

  const renamePortfolioInDB = async (portfolioId, newName, uid) => {
    try {
      await supabase.from('portfolios')
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq('id', portfolioId).eq('user_id', uid);
      setPortfolios(prev => prev.map(p => p.id === portfolioId ? { ...p, name: newName } : p));
      if (activePortfolioId === portfolioId) setPortfolioName(newName);
    } catch(e) { console.error('renamePortfolio:', e); }
  };

  const deletePortfolioFromDB = async (portfolioId, uid) => {
    try {
      await supabase.from('assets').delete().eq('portfolio_id', portfolioId).eq('user_id', uid);
      await supabase.from('portfolios').delete().eq('id', portfolioId).eq('user_id', uid);
      const remaining = portfolios.filter(p => p.id !== portfolioId);
      setPortfolios(remaining);
      if (activePortfolioId === portfolioId) {
        setActivePortfolioId(remaining[0].id);
        setPortfolioName(remaining[0].name);
        setAssets([]); setChartAsset(null);
      }
    } catch(e) { console.error('deletePortfolio:', e); }
  };

  // ── Switch portefeuille ──
  const switchPortfolio = async (portfolioId, portfolioName) => {
    if (activePortfolioId === portfolioId) return;
    // Récupérer le vrai userId depuis Supabase session (pas le state React qui peut être stale)
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const uid = currentUser?.id ?? userId;
    if (!uid) { console.error("switchPortfolio: pas de userId"); return; }
    setActivePortfolioId(portfolioId);
    setPortfolioName(portfolioName);
    setAssets([]);
    setChartAsset(null);
    try {
      console.log("switchPortfolio: uid=", uid, "portfolioId=", portfolioId);
      const { data, error } = await supabase
        .from("assets").select("*")
        .eq("user_id", uid)
        .eq("portfolio_id", portfolioId)
        .order("created_at", { ascending: true });
      console.log("switchPortfolio: data=", data, "error=", error);
      if (error) { console.error("switchPortfolio error:", error); return; }
      if (data && data.length > 0) {
        const loaded = data.map(row => ({
          id: row.id, symbol: row.symbol, name: row.name, type: row.type,
          qty: Number(row.qty), price: Number(row.current_price),
          change: Number(row.price_change_24h ?? 0), color: row.color,
          dividends: [], histories: buildHistories(Number(row.current_price)),
          purchase: row.purchase_data ?? null,
        }));
        setAssets(loaded);
        setChartAsset(loaded[0]);
      }
    } catch(e) { console.error("switchPortfolio:", e); }
  };

  // ── Chargement initial ──
  useEffect(() => {
    const loadForUser = async (u) => {
      setDbLoading(true);
      try {
        const activeId = await loadUserData(u.id);
        const { data, error } = await supabase.from("assets").select("*")
          .eq("user_id", u.id).eq("portfolio_id", activeId)
          .order("created_at", { ascending: true });
        if (error) { console.error("Supabase load:", error); setDbLoading(false); return; }
        if (data && data.length > 0) {
          const loaded = data.map(row => ({
            id:row.id, symbol:row.symbol, name:row.name, type:row.type,
            qty:Number(row.qty), price:Number(row.current_price),
            change:Number(row.price_change_24h??0), color:row.color,
            dividends:[], histories:buildHistories(Number(row.current_price)),
            purchase:row.purchase_data??null,
          }));
          setAssets(loaded); setChartAsset(loaded[0]);
        }
      } catch(e) { console.error("init:", e); }
      setDbLoading(false);
    };

    // Écoute les changements d auth (restauration session, login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user); setUserId(session.user.id);
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
          await loadForUser(session.user);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null); setUserId(null); setAssets([]); setChartAsset(null);
        setPortfolios([{id:"default", name:"Mon Portefeuille"}]);
        setActivePortfolioId("default"); setPortfolioName("Mon Portefeuille"); setProfileName("");
        setDbLoading(false);
      }
    });

    // Vérification initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { setDbLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Auth ──
  const handleLogin = async () => {
    setAuthLoading(true); setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) { setAuthError(error.message); setAuthLoading(false); return; }
    // Forcer la persistance de session
    if (rememberMe) {
      // Forcer le refresh du token pour maximiser la durée de session
      await supabase.auth.refreshSession();
    }
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u); setUserId(u.id);
    setDbLoading(true);
    const activeId = await loadUserData(u.id);
    const { data } = await supabase.from("assets").select("*")
      .eq("user_id", u.id).eq("portfolio_id", activeId)
      .order("created_at", { ascending: true });
    if (data && data.length > 0) {
      const loaded = data.map(row => ({
        id:row.id, symbol:row.symbol, name:row.name, type:row.type,
        qty:Number(row.qty), price:Number(row.current_price), change:Number(row.price_change_24h??0),
        color:row.color, dividends:[], histories:buildHistories(Number(row.current_price)),
        purchase:row.purchase_data??null,
      }));
      setAssets(loaded); setChartAsset(loaded[0]);
    }
    setDbLoading(false); setAuthLoading(false);
    // Appliquer la durée de session si "rester connecté" n'est pas "toujours"
    if (!rememberMe || sessionDuration !== "always") {
      const durations = {"1h":3600,"6h":21600,"12h":43200,"24h":86400};
      const secs = rememberMe ? durations[sessionDuration] : durations["1h"];
      if (secs) setTimeout(() => supabase.auth.signOut(), secs * 1000);
    }
  };

  const handleRegister = async () => {
    setAuthLoading(true); setAuthError("");
    const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
    if (error) { setAuthError(error.message); setAuthLoading(false); return; }
    setAuthError("✅ Compte créé ! Vérifiez votre email puis connectez-vous.");
    setAuthMode("login"); setAuthLoading(false);
  };

  const handleResetPassword = async () => {
    if (!authEmail) { setAuthError("Entrez votre email d'abord"); return; }
    setAuthLoading(true); setAuthError("");
    const { error } = await supabase.auth.resetPasswordForEmail(authEmail, { redirectTo: window.location.origin + "/portfolio" });
    if (error) setAuthError(error.message);
    else setAuthError("✅ Email de réinitialisation envoyé ! Vérifiez votre boîte mail.");
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setUserId(null); setAssets([]); setChartAsset(null);
    setPortfolios([{id:"default", name:"Mon Portefeuille"}]);
    setActivePortfolioId("default");
    setPortfolioName("Mon Portefeuille");
    setProfileName("");
  };

  const saveAssetToDB = async (asset) => {
    if (!userId) return;
    const row = { id:asset.id, user_id:userId, portfolio_id:activePortfolioId, symbol:asset.symbol, name:asset.name, type:asset.type, color:asset.color, current_price:asset.price, price_change_24h:asset.change, qty:asset.qty, purchase_data:asset.purchase??null };
    const { error } = await supabase.from("assets").upsert(row, { onConflict: "id" });
    if (error) console.error("saveAsset:", error);
  };

  const deleteAssetFromDB = async (assetId) => {
    if (!userId) return;
    const { error } = await supabase.from("assets").delete().eq("id", assetId);
    if (error) console.error("deleteAsset:", error);
  };

  // Persister la watchlist marchés
  useEffect(() => {
    try { localStorage.setItem("market_watchlist", JSON.stringify(allMarket)); } catch(e) {}
  }, [allMarket]);



  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const cryptoSymbols = assets.filter(a=>a.type==='crypto').map(a=>a.symbol).join(',');
        const stockSymbols  = assets.filter(a=>a.type!=='crypto').map(a=>a.symbol).join(',');
        const mktCrypto     = allMarket.filter(a=>a.type==='crypto').map(a=>a.symbol).join(',');
        const mktStock      = allMarket.filter(a=>a.type!=='crypto').map(a=>a.symbol).join(',');
        const allCrypto = [...new Set([...cryptoSymbols.split(','),...mktCrypto.split(',')].filter(Boolean))].join(',');
        const allStock  = [...new Set([...stockSymbols.split(','),...mktStock.split(',')].filter(Boolean))].join(',');
        const [cryptoRes, stockRes] = await Promise.all([
          allCrypto ? fetch(`/api/prices/crypto?symbols=${allCrypto}`) : Promise.resolve({ ok: false }),
          allStock  ? fetch(`/api/prices/stocks?symbols=${allStock}`)  : Promise.resolve({ ok: false }),
        ]);
        const cryptoPrices = cryptoRes.ok ? await cryptoRes.json() : {};
        const stockPrices  = stockRes.ok  ? await stockRes.json()  : {};
        const allPrices    = { ...cryptoPrices, ...stockPrices };
        setAssets(prev => prev.map(a => {
          const p = allPrices[a.symbol]; if (!p) return a;
          const newPrice = p.price ?? a.price;
          const purchaseRef = a.purchase?.priceOriginal ?? a.purchase?.priceUSD ?? a.purchase?.price;
          const realChange = purchaseRef ? ((newPrice - purchaseRef) / purchaseRef) * 100 : (p.change24h ?? a.change);
          return { ...a, price: newPrice, change: Math.round(realChange * 100) / 100 };
        }));
        setAllMarket(prev => prev.map(a => {
          const p = allPrices[a.symbol]; if (!p) return a;
          return { ...a, price: p.price ?? a.price, change: p.change24h ?? a.change };
        }));
      } catch (e) { console.error('Erreur fetch prix:', e); }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const fmt         = useFmt(currency);
  const total       = assets.reduce((s,a)=>s+a.qty*a.price,0);
  const totalChange = assets.reduce((s,a)=>s+a.qty*a.price*(a.change/100),0);
  const totalPct    = (totalChange/(total-totalChange))*100;
  const cryptoAssets= assets.filter(a=>a.type==="crypto");
  const stockAssets = assets.filter(a=>a.type!=="crypto");
  const mktList     = mktFilter==="all" ? allMarket : allMarket.filter(a=>a.type===mktFilter);

  const handleAddAsset = async (newAsset) => {
    setAssets(prev => [...prev, newAsset]);
    if (!chartAsset) setChartAsset(newAsset);
    await saveAssetToDB(newAsset);
    try {
      const isCrypto = newAsset.type === 'crypto';
      const endpoint = isCrypto ? `/api/prices/crypto?symbols=${newAsset.symbol}` : `/api/prices/stocks?symbols=${newAsset.symbol}`;
      const res  = await fetch(endpoint);
      const data = await res.json();
      const p    = data[newAsset.symbol];
      if (p && p.price) {
        const purchaseRef = newAsset.purchase?.priceOriginal ?? newAsset.purchase?.priceUSD ?? newAsset.purchase?.price;
        const realChange = purchaseRef ? ((p.price - purchaseRef) / purchaseRef) * 100 : (p.change24h ?? 0);
        const updatedAsset = { ...newAsset, price: p.price, change: Math.round(realChange * 100) / 100, histories: buildHistories(p.price) };
        setAssets(prev => prev.map(a => a.id === newAsset.id ? updatedAsset : a));
        await saveAssetToDB(updatedAsset);
      }
    } catch(e) { console.error('Fetch prix nouvel actif:', e); }
  };

  const handleDeleteAsset = async (id) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    await deleteAssetFromDB(id);
  };

  const handleAddDividend = (assetId, div) => {
    setAssets(prev=>prev.map(a=>a.id===assetId?{...a,dividends:[...a.dividends,div]}:a));
    if(detailAsset?.id===assetId) setDetailAsset(prev=>({...prev,dividends:[...prev.dividends,div]}));
  };

  const handleAddTransaction = (assetId, tx) => {
    setAssets(prev=>prev.map(a=>{
      if(a.id!==assetId) return a;
      const txs = [...(a.transactions||[]), tx];
      const totalQty = txs.reduce((s,t)=>t.type==="buy"?s+t.qty:s-t.qty, 0);
      return {...a, transactions: txs, qty: Math.max(0, Math.round(totalQty*1e8)/1e8)};
    }));
  };

  const handleDeleteTransaction = (assetId, txId) => {
    setAssets(prev=>prev.map(a=>{
      if(a.id!==assetId) return a;
      const txs = (a.transactions||[]).filter(t=>t.id!==txId);
      const totalQty = txs.reduce((s,t)=>t.type==="buy"?s+t.qty:s-t.qty, 0);
      return {...a, transactions: txs, qty: Math.max(0, Math.round(totalQty*1e8)/1e8)};
    }));
  };

  const syncedDetailAsset = detailAsset ? assets.find(a=>a.id===detailAsset.id)||detailAsset : null;

  const navItems = [
    { label:"Actifs",  i:0, icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
    { label:"Marchés", i:1, icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="16 7 22 7 22 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label:"Banque",  i:2, icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="8" width="20" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M2 12h20" stroke="currentColor" strokeWidth="1.8"/><path d="M6 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 5L12 2 8 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  ];

  // ── Écran login ──
  if (!dbLoading && !user) {
    const isLogin = authMode === "login";
    return (
      <div style={{fontFamily:"'DM Sans',sans-serif",background:"#0A0906",minHeight:"100dvh",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"20px",paddingTop:"max(40px, env(safe-area-inset-top, 40px))",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0;} body{height:100%;} html{height:100%;}`}</style>
        <div style={{width:"100%",maxWidth:380,background:"#1A1714",borderRadius:24,padding:"32px 28px",border:"1px solid #2A2520",boxShadow:"0 24px 60px #000a",marginBottom:40}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,#C8A96E,#A08040)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 12px"}}>₿</div>
            <div style={{color:"#F0EDE8",fontSize:20,fontWeight:700}}>Portfolio Tracker</div>
            <div style={{color:"#5A5550",fontSize:12,marginTop:4}}>{isLogin?"Connectez-vous à votre compte":"Créez votre compte"}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <div style={{color:"#6A6560",fontSize:10,marginBottom:5,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>Email</div>
              <input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="votre@email.com" onKeyDown={e=>e.key==="Enter"&&(isLogin?handleLogin():handleRegister())}
                style={{width:"100%",background:"#0E0D0A",border:"1px solid #252015",borderRadius:12,padding:"12px 14px",color:"#F0EDE8",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none"}}/>
            </div>
            <div>
              <div style={{color:"#6A6560",fontSize:10,marginBottom:5,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>Mot de passe</div>
              <input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&(isLogin?handleLogin():handleRegister())}
                style={{width:"100%",background:"#0E0D0A",border:"1px solid #252015",borderRadius:12,padding:"12px 14px",color:"#F0EDE8",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none"}}/>
            </div>
            {authError && (
              <div style={{color:authError.startsWith("✅")?"#4ADE80":"#F87171",fontSize:12,padding:"10px 12px",background:authError.startsWith("✅")?"#4ADE8015":"#F8717115",borderRadius:10,border:`1px solid ${authError.startsWith("✅")?"#4ADE8030":"#F8717130"}`}}>
                {authError}
              </div>
            )}
            {isLogin && (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"4px 2px"}}>
                <div onClick={()=>setRememberMe(v=>!v)}
                  style={{width:20,height:20,borderRadius:6,border:`2px solid ${rememberMe?"#C8A96E":"#3A3530"}`,background:rememberMe?"#C8A96E":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
                  {rememberMe&&<div style={{color:"#111009",fontSize:12,fontWeight:900,lineHeight:1}}>✓</div>}
                </div>
                <span style={{color:"#8A8580",fontSize:12,cursor:"pointer"}} onClick={()=>setRememberMe(v=>!v)}>Rester connecté</span>
              </div>
            )}
            <button onClick={isLogin?handleLogin:handleRegister} disabled={authLoading}
              style={{background:"linear-gradient(135deg,#C8A96E,#A08040)",border:"none",borderRadius:12,padding:"13px",color:"#111009",fontSize:14,fontWeight:700,cursor:"pointer",marginTop:4,opacity:authLoading?0.7:1}}>
              {authLoading?"…":isLogin?"Se connecter":"Créer le compte"}
            </button>
            <button onClick={()=>{setAuthMode(isLogin?"register":"login");setAuthError("");}}
              style={{background:"transparent",border:"none",color:"#5A5550",fontSize:12,cursor:"pointer",padding:"6px"}}>
              {isLogin?"Pas encore de compte ? S'inscrire":"Déjà un compte ? Se connecter"}
            </button>
            {isLogin && <button onClick={handleResetPassword} style={{background:"transparent",border:"none",color:"#3A3530",fontSize:11,cursor:"pointer",padding:"4px"}}>Mot de passe oublié ?</button>}
          </div>
        </div>
      </div>
    );
  }

  if (dbLoading) return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#0A0906",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;700&display=swap');`}</style>
      <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#C8A96E,#A08040)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>₿</div>
      <div style={{color:"#C8A96E",fontSize:13,fontFamily:"'DM Mono',monospace",letterSpacing:1}}>Chargement du portfolio…</div>
    </div>
  );

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#0A0906",height:"100vh",width:"100vw",display:"flex",justifyContent:"center",alignItems:"center",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        :root{--sat:env(safe-area-inset-top,0px);--sab:env(safe-area-inset-bottom,0px);}
        ::-webkit-scrollbar{display:none;}
        .asset-row{transition:background 0.15s;cursor:pointer;}
        .asset-row:hover{background:#181410!important;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        .fadein{animation:fadeUp 0.3s ease both;}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
        .live-dot{animation:pulse 2s ease-in-out infinite;}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        input::placeholder{color:#3A3530;}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.3);}
        .add-btn:hover{transform:scale(1.05);}
        .add-btn{transition:transform 0.15s,box-shadow 0.15s;}
      `}</style>
      <div style={{width:"100%",maxWidth:430,background:"#151210",borderRadius:0,overflow:"hidden",height:"100vh",position:"relative",display:"flex",flexDirection:"column"}}>

        {/* Fixed top */}
        <div style={{flexShrink:0}}>
          {/* Header */}
          <div style={{padding:"12px 20px 0",paddingTop:"calc(12px + env(safe-area-inset-top, 0px))",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{position:"relative"}}>
                <div data-profile-menu onClick={()=>setShowProfileMenu(m=>!m)} style={{width:36,height:36,borderRadius:18,background:"linear-gradient(135deg,#C8A96E,#8B6914)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#111009",cursor:"pointer",userSelect:"none"}}>
                  {user?.email?.[0]?.toUpperCase()??"A"}
                </div>
                <div className="live-dot" style={{position:"absolute",bottom:0,right:0,width:8,height:8,borderRadius:4,background:"#4ADE80",border:"2px solid #151210"}}/>

              </div>
              <div style={{color:"#F0EDE8",fontSize:21,fontWeight:700,letterSpacing:-0.3}}>{portfolioName}</div>
            </div>
            <div style={{display:"flex",background:"#1A1714",borderRadius:20,padding:3,border:"1px solid #252015",gap:2}}>
              {["USD","EUR"].map(c=>(
                <button key={c} onClick={()=>setCurrency(c)} style={{padding:"4px 10px",borderRadius:16,border:"none",cursor:"pointer",background:currency===c?"#C8A96E":"transparent",color:currency===c?"#111009":"#5A5550",fontSize:10,fontWeight:700,fontFamily:"'DM Mono',monospace",transition:"all 0.2s"}}>{c}</button>
              ))}
            </div>
          </div>

          {/* Total card */}
          {tab!==2 && (
            <div className="fadein" style={{margin:"12px 20px",background:"linear-gradient(135deg,#1E1A12,#28200E,#1C1810)",borderRadius:24,padding:"18px 20px 14px",border:"1px solid #3A3018",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,#C8A96E0A,transparent 70%)"}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",position:"relative"}}>
                <div>
                  <div style={{color:"#6A6050",fontSize:10,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:4}}>Valeur totale</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:34,fontWeight:700,color:"#F0EDE8",letterSpacing:-2,lineHeight:1}}>{fmt(total,0)}</div>
                </div>
                <div style={{background:totalPct>=0?"#4ADE8015":"#F8717115",border:`1px solid ${totalPct>=0?"#4ADE8030":"#F8717130"}`,color:totalPct>=0?"#4ADE80":"#F87171",borderRadius:12,padding:"5px 11px",fontSize:12,fontFamily:"'DM Mono',monospace",fontWeight:700,marginTop:3}}>
                  {totalPct>=0?"▲":"▼"} {Math.abs(totalPct).toFixed(2)}%
                </div>
              </div>
              <div style={{color:"#5A5040",fontSize:11,marginTop:4,fontFamily:"'DM Mono',monospace"}}>
                {totalChange>=0?"+ ":"- "}{fmt(Math.abs(totalChange),0)} aujourd'hui
              </div>
              <div style={{marginTop:14,display:"flex",gap:2,borderRadius:6,overflow:"hidden",height:4}}>
                {assets.map(a=><div key={a.id} style={{flex:a.qty*a.price,background:a.color,opacity:0.75}}/>)}
              </div>
              <div style={{display:"flex",gap:12,marginTop:6,flexWrap:"wrap"}}>
                {[["crypto","Crypto","#F7931A"],["stock","Actions/ETF","#A3B8C2"]].map(([type,label,col])=>{
                  const val=assets.filter(a=>a.type===type||(type==="stock"&&a.type==="etf")).reduce((s,a)=>s+a.qty*a.price,0);
                  return <div key={type} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:5,height:5,borderRadius:"50%",background:col}}/><span style={{color:"#5A5040",fontSize:9,fontFamily:"'DM Mono',monospace"}}>{label} {(val/total*100).toFixed(0)}%</span></div>;
                })}
                <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5}}>
                  <div className="live-dot" style={{width:4,height:4,borderRadius:"50%",background:"#4ADE80"}}/>
                  <span style={{color:"#5A5040",fontSize:9,fontFamily:"'DM Mono',monospace"}}>Live</span>
                </div>
              </div>
            </div>
          )}

          {/* Toolbar Marchés */}
          {tab===1 && (
            <div style={{padding:"8px 20px 10px",background:"#151210"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div className="live-dot" style={{width:6,height:6,borderRadius:3,background:"#4ADE80"}}/>
                  <span style={{color:"#4A4540",fontSize:11,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Prix en direct</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{display:"flex",background:"#1A1714",borderRadius:20,padding:3,border:"1px solid #252015",gap:1}}>
                    {[["all","Tout"],["crypto","Crypto"],["stock","Actions"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setMktFilter(v)} style={{padding:"3px 10px",borderRadius:16,border:"none",cursor:"pointer",background:mktFilter===v?"#C8A96E":"transparent",color:mktFilter===v?"#111009":"#5A5550",fontSize:10,fontWeight:700,fontFamily:"'DM Sans',sans-serif",transition:"all 0.2s"}}>{l}</button>
                    ))}
                  </div>
                  <button onClick={()=>setDragMktMode(d=>!d)} style={{background:dragMktMode?"#C8A96E20":"transparent",border:`1px solid ${dragMktMode?"#C8A96E60":"#2A2520"}`,borderRadius:10,padding:"5px 9px",color:dragMktMode?"#C8A96E":"#5A5550",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}>⠿</button>
                  <button onClick={()=>{setShowMktAdd(s=>!s);setMktAddError("");}} style={{background:"#C8A96E20",border:"1px solid #C8A96E40",borderRadius:10,padding:"5px 11px",color:"#C8A96E",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Ajouter</button>
                </div>
              </div>
            </div>
          )}

          {/* Toolbar Actifs */}
          {tab===0 && (
            <div style={{padding:"8px 20px 6px",background:"#151210"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{color:"#4A4540",fontSize:10,fontFamily:"'DM Mono',monospace"}}>Vue :</span>
                  <div style={{display:"flex",background:"#1A1714",borderRadius:20,padding:3,border:"1px solid #252015",gap:1}}>
                    {[["grouped","Regroupé"],["split","Séparé"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setViewMode(v)} style={{padding:"4px 10px",borderRadius:16,border:"none",cursor:"pointer",background:viewMode===v?"#252015":"transparent",color:viewMode===v?"#C8A96E":"#5A5550",fontSize:10,fontWeight:viewMode===v?700:500,fontFamily:"'DM Sans',sans-serif",transition:"all 0.2s"}}>{l}</button>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>setDragMode(d=>!d)} style={{width:34,height:34,borderRadius:11,background:dragMode?"#C8A96E20":"#1A1714",border:`1px solid ${dragMode?"#C8A96E60":"#252015"}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke={dragMode?"#C8A96E":"#5A5550"} strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                  <button className="add-btn" onClick={()=>setShowAddModal(true)} style={{width:34,height:34,borderRadius:11,background:"linear-gradient(135deg,#C8A96E,#A08040)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px #C8A96E30"}}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#111009" strokeWidth="2.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
              <div style={{display:"flex",gap:4,background:"#1A1714",borderRadius:13,padding:3,border:"1px solid #1E1B16"}}>
                {TIME_SCALES.map(ts=>{
                  const active=listScale===ts.label;
                  return <button key={ts.label} onClick={()=>setListScale(ts.label)} style={{flex:1,padding:"5px 0",border:active?"1px solid #C8A96E35":"1px solid transparent",cursor:"pointer",background:active?"#C8A96E20":"transparent",color:active?"#C8A96E":"#4A4540",borderRadius:10,fontSize:10,fontWeight:active?700:500,fontFamily:"'DM Mono',monospace",transition:"all 0.2s"}}>{ts.label}</button>;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div style={{flex:1,overflowY:"auto",paddingBottom:80,WebkitOverflowScrolling:"touch"}}
          onTouchStart={e=>{ if(!dragMode&&!dragMktMode) swipeStartX.current=e.touches[0].clientX; }}
          onTouchEnd={e=>{
            if(dragMode||dragMktMode) return;
            const dx=e.changedTouches[0].clientX-swipeStartX.current;
            if(Math.abs(dx)>60){if(dx<0&&tab<2){setTab(tab+1);setDetailAsset(null);}if(dx>0&&tab>0){setTab(tab-1);setDetailAsset(null);}}
          }}>

          {/* ── ACTIFS ── */}
          {tab===0 && (
            <div className="fadein">
              {viewMode==="grouped" ? (
                <div ref={assetsListRef} onTouchMove={handleAssetTouchMove} onTouchEnd={handleAssetTouchEnd}>
                {assets.map((a,idx)=>{
                  const scaleData=a.histories?.[listScale]||[a.price];
                  const buyPrice=a.purchase?.price;
                  const scalePct=buyPrice?((a.price-buyPrice)/buyPrice*100):((scaleData[scaleData.length-1]-scaleData[0])/scaleData[0]*100);
                  const scaleAmt=buyPrice?(a.price-buyPrice)*a.qty:(scaleData[scaleData.length-1]-scaleData[0])*a.qty;
                  const pos=scalePct>=0; const iconSize=44,chartW=68,chartH=28,fontSize=15;
                  return (
                    <div key={a.id}>
                      {/* Barre d'insertion avant cet item */}
                      {dragMode && assetDragOverIdx === idx && assetDraggingIdx !== idx && (
                        <div style={{height:2,background:"#C8A96E",borderRadius:2,margin:"0 20px",boxShadow:"0 0 6px #C8A96E80"}}/>
                      )}
                    <div className="asset-row"
                      data-asset-item={idx}
                      draggable={dragMode}
                      onDragStart={(e)=>{e.dataTransfer.effectAllowed="move"; dragItem.current=idx; setAssetDraggingIdx(idx); setAssetDragOverIdx(null);}}
                      onDragEnter={()=>{dragOverItem.current=idx; setAssetDragOverIdx(idx!==dragItem.current?idx:null);}}
                      onDragEnd={()=>{handleDragSort(); setAssetDraggingIdx(null); setAssetDragOverIdx(null);}}
                      onDragOver={e=>e.preventDefault()}
                      onTouchStart={e=>handleAssetTouchStart(e, idx, a)}
                      onTouchMove={e=>{ if(assetDragActive.current) handleAssetTouchMove(e); }}
                      onTouchEnd={e=>{ if(assetDragActive.current) { e.stopPropagation(); handleAssetTouchEnd(); } }}
                      onTouchCancel={handleAssetTouchEnd}
                      onClick={()=>!dragMode&&setDetailAsset(a)}
                      style={{padding:"12px 20px",borderBottom:"1px solid #191612",cursor:dragMode?"grab":"pointer",opacity:assetDraggingIdx===idx?0.25:1,userSelect:dragMode?"none":"auto",WebkitUserSelect:dragMode?"none":"auto",touchAction:dragMode?"none":"auto"}}>
                      <div style={{display:"flex",alignItems:"center",gap:11}}>
                        {dragMode&&<div style={{color:"#3A3530",marginRight:4,fontSize:16,cursor:"grab",flexShrink:0}}>⠿</div>}
                        <div style={{width:iconSize,height:iconSize,borderRadius:14,background:`${a.color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(iconSize*0.3),fontWeight:800,color:a.color,border:`1px solid ${a.color}28`,flexShrink:0,fontFamily:"'DM Mono',monospace"}}>{a.symbol.slice(0,2)}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div>
                              <div style={{display:"flex",alignItems:"center",gap:5}}>
                                <span style={{color:"#F0EDE8",fontWeight:600,fontSize,fontFamily:"'DM Mono',monospace"}}>{a.symbol}</span>
                                {a.type==="etf"&&<span style={{background:"#00A4EF20",color:"#00A4EF",fontSize:8,fontWeight:700,borderRadius:4,padding:"1px 5px",fontFamily:"'DM Mono',monospace"}}>ETF</span>}
                                {a.type!=="crypto"&&a.dividends.length>0&&<span style={{fontSize:10}}>💰</span>}
                              </div>
                              <div style={{color:"#4A4540",fontSize:10,marginTop:2}}>{a.qty} {a.symbol}</div>
                            </div>
                            {!dragMode&&<div style={{textAlign:"right",marginRight:8}}>
                              <div style={{fontFamily:"'DM Mono',monospace",color:"#F0EDE8",fontWeight:600,fontSize:Math.round(fontSize*0.93)}}>{fmt(a.qty*a.price,0)}</div>
                              <div style={{display:"flex",alignItems:"center",gap:4,justifyContent:"flex-end",marginTop:2}}>
                                <span style={{color:pos?"#4ADE80":"#F87171",fontSize:10,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{pos?"+":"-"}{fmt(Math.abs(scaleAmt),2)}</span>
                                <span style={{color:pos?"#3ABB60":"#D86060",fontSize:9,fontFamily:"'DM Mono',monospace",opacity:0.8}}>{pos?"▲":"▼"}{Math.abs(scalePct).toFixed(2)}%</span>
                              </div>
                            </div>}
                          </div>
                        </div>
                        {!dragMode&&<MiniChart data={scaleData} color={a.color} w={chartW} h={chartH}/>}
                      </div>
                    </div>
                    </div>
                  );
                })}
                </div>
              ) : (
                <>
                  <div style={{margin:"0 20px 4px",background:"#1A1714",borderRadius:14,padding:"11px 14px",border:"1px solid #F7931A20"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:7,height:7,borderRadius:4,background:"#F7931A"}}/><span style={{color:"#8B8580",fontSize:10,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Crypto</span><span style={{color:"#3A3530",fontSize:9,fontFamily:"'DM Mono',monospace"}}>· {cryptoAssets.length}</span></div>
                      <span style={{color:"#F0EDE8",fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:700}}>{fmt(cryptoAssets.reduce((s,a)=>s+a.qty*a.price,0),0)}</span>
                    </div>
                  </div>
                  {cryptoAssets.map(a=>{
                    const scaleData=a.histories?.[listScale]||[a.price]; const buyPrice=a.purchase?.price;
                    const scalePct=buyPrice?((a.price-buyPrice)/buyPrice*100):((scaleData[scaleData.length-1]-scaleData[0])/scaleData[0]*100);
                    const scaleAmt=buyPrice?(a.price-buyPrice)*a.qty:(scaleData[scaleData.length-1]-scaleData[0])*a.qty;
                    const pos=scalePct>=0; const iconSize=40,chartW=60,chartH=24,fontSize=14;
                    return (
                      <div key={a.id} className="asset-row" onClick={()=>setDetailAsset(a)} style={{padding:"12px 20px",borderBottom:"1px solid #191612"}}>
                        <div style={{display:"flex",alignItems:"center",gap:11}}>
                          <div style={{width:iconSize,height:iconSize,borderRadius:14,background:`${a.color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(iconSize*0.3),fontWeight:800,color:a.color,border:`1px solid ${a.color}28`,flexShrink:0,fontFamily:"'DM Mono',monospace"}}>{a.symbol.slice(0,2)}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <div><span style={{color:"#F0EDE8",fontWeight:600,fontSize,fontFamily:"'DM Mono',monospace"}}>{a.symbol}</span><div style={{color:"#4A4540",fontSize:10,marginTop:2}}>{a.qty} {a.symbol}</div></div>
                              <div style={{textAlign:"right",marginRight:8}}>
                                <div style={{fontFamily:"'DM Mono',monospace",color:"#F0EDE8",fontWeight:600,fontSize:Math.round(fontSize*0.93)}}>{fmt(a.qty*a.price,0)}</div>
                                <div style={{display:"flex",alignItems:"center",gap:4,justifyContent:"flex-end",marginTop:2}}>
                                  <span style={{color:pos?"#4ADE80":"#F87171",fontSize:10,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{pos?"+":"-"}{fmt(Math.abs(scaleAmt),2)}</span>
                                  <span style={{color:pos?"#3ABB60":"#D86060",fontSize:9,fontFamily:"'DM Mono',monospace",opacity:0.8}}>{pos?"▲":"▼"}{Math.abs(scalePct).toFixed(2)}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <MiniChart data={scaleData} color={a.color} w={chartW} h={chartH}/>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{height:8}}/>
                  <div style={{margin:"0 20px 4px",background:"#1A1714",borderRadius:14,padding:"11px 14px",border:"1px solid #A3B8C220"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:7,height:7,borderRadius:4,background:"#A3B8C2"}}/><span style={{color:"#8B8580",fontSize:10,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Actions & ETF</span><span style={{color:"#3A3530",fontSize:9,fontFamily:"'DM Mono',monospace"}}>· {stockAssets.length}</span></div>
                      <span style={{color:"#F0EDE8",fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:700}}>{fmt(stockAssets.reduce((s,a)=>s+a.qty*a.price,0),0)}</span>
                    </div>
                  </div>
                  {stockAssets.map(a=>{
                    const scaleData=a.histories?.[listScale]||[a.price]; const buyPrice=a.purchase?.price;
                    const scalePct=buyPrice?((a.price-buyPrice)/buyPrice*100):((scaleData[scaleData.length-1]-scaleData[0])/scaleData[0]*100);
                    const scaleAmt=buyPrice?(a.price-buyPrice)*a.qty:(scaleData[scaleData.length-1]-scaleData[0])*a.qty;
                    const pos=scalePct>=0; const iconSize=40,chartW=60,chartH=24,fontSize=14;
                    return (
                      <div key={a.id} className="asset-row" onClick={()=>setDetailAsset(a)} style={{padding:"12px 20px",borderBottom:"1px solid #191612"}}>
                        <div style={{display:"flex",alignItems:"center",gap:11}}>
                          <div style={{width:iconSize,height:iconSize,borderRadius:14,background:`${a.color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(iconSize*0.3),fontWeight:800,color:a.color,border:`1px solid ${a.color}28`,flexShrink:0,fontFamily:"'DM Mono',monospace"}}>{a.symbol.slice(0,2)}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <div>
                                <div style={{display:"flex",alignItems:"center",gap:5}}>
                                  <span style={{color:"#F0EDE8",fontWeight:600,fontSize,fontFamily:"'DM Mono',monospace"}}>{a.symbol}</span>
                                  {a.type==="etf"&&<span style={{background:"#00A4EF20",color:"#00A4EF",fontSize:8,fontWeight:700,borderRadius:4,padding:"1px 5px",fontFamily:"'DM Mono',monospace"}}>ETF</span>}
                                  {a.dividends.length>0&&<span style={{fontSize:10}}>💰</span>}
                                </div>
                                <div style={{color:"#4A4540",fontSize:10,marginTop:2}}>{a.qty} {a.symbol}</div>
                              </div>
                              <div style={{textAlign:"right",marginRight:8}}>
                                <div style={{fontFamily:"'DM Mono',monospace",color:"#F0EDE8",fontWeight:600,fontSize:Math.round(fontSize*0.93)}}>{fmt(a.qty*a.price,0)}</div>
                                <div style={{display:"flex",alignItems:"center",gap:4,justifyContent:"flex-end",marginTop:2}}>
                                  <span style={{color:pos?"#4ADE80":"#F87171",fontSize:10,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{pos?"+":"-"}{fmt(Math.abs(scaleAmt),2)}</span>
                                  <span style={{color:pos?"#3ABB60":"#D86060",fontSize:9,fontFamily:"'DM Mono',monospace",opacity:0.8}}>{pos?"▲":"▼"}{Math.abs(scalePct).toFixed(2)}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <MiniChart data={scaleData} color={a.color} w={chartW} h={chartH}/>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* ── MARCHÉS ── */}
          {tab===1 && (
            <div className="fadein" style={{padding:"0 20px", userSelect:"none", WebkitUserSelect:"none"}}
              ref={mktListRef}
              onTouchMove={handleMktTouchMove}
              onTouchEnd={handleMktTouchEnd}>

              {mktList.map((a,idx)=>{
                const realIdx=allMarket.indexOf(a);
                const dbEntry=SYMBOL_DATABASE.find(s=>s.symbol===a.symbol);
                const displayName=(a.name&&a.name!==a.symbol)?a.name:(dbEntry?.name||a.symbol);
                const isDragging = mktDraggingIdx === realIdx;
                // La barre s'affiche AU-DESSUS de l'item mktDragOverIdx
                const showBarBefore = dragMktMode && mktDragOverIdx === realIdx && mktDraggingIdx !== realIdx;
                // Barre finale après le dernier item
                const isLast = idx === mktList.length - 1;
                const showBarAfter = dragMktMode && isLast && mktDragOverIdx !== null && mktDragOverIdx > realIdx && mktDraggingIdx !== realIdx;
                return (
                  <div key={a.symbol}>
                    {/* Barre d'insertion AVANT cet item */}
                    {showBarBefore && (
                      <div style={{height:2, background:"#C8A96E", borderRadius:2, margin:"0 0", boxShadow:"0 0 6px #C8A96E80"}}/>
                    )}
                    <div
                      data-mkt-item={realIdx}
                      onTouchStart={e=>handleMktTouchStart(e, realIdx)}
                      onTouchMove={e=>{ if(mktDragActive.current) handleMktTouchMove(e); }}
                      onTouchEnd={e=>{ if(mktDragActive.current) { e.stopPropagation(); handleMktTouchEnd(); } }}
                      onTouchCancel={handleMktTouchEnd}
                      style={{
                        display:"flex", alignItems:"center", justifyContent:"space-between",
                        padding:"12px 0", borderBottom:"1px solid #191612",
                        cursor:dragMktMode?"grab":"default",
                        opacity: isDragging ? 0.25 : 1,
                        transition: "opacity 0.1s",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        touchAction: dragMktMode ? "none" : "auto",
                      }}>
                      <div style={{display:"flex",alignItems:"center",gap:11}}>
                        {dragMktMode&&<div style={{color: isDragging?"#C8A96E":"#3A3530",fontSize:16,flexShrink:0}}>⠿</div>}
                        <div style={{width:40,height:40,borderRadius:12,background:`${a.color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:a.color,border:`1px solid ${a.color}25`,flexShrink:0,fontFamily:"'DM Mono',monospace"}}>{a.symbol.slice(0,2)}</div>
                        <div><div style={{color:"#F0EDE8",fontWeight:600,fontSize:14}}>{displayName}</div><div style={{color:"#4A4540",fontSize:11,marginTop:1,fontFamily:"'DM Mono',monospace"}}>{a.symbol}</div></div>
                      </div>
                      {!dragMktMode&&<div style={{textAlign:"right"}}>
                        <div style={{fontFamily:"'DM Mono',monospace",color:"#F0EDE8",fontWeight:600,fontSize:14}}>{fmt(a.price,2)}</div>
                        <div style={{color:a.change>=0?"#4ADE80":"#F87171",fontSize:11,fontFamily:"'DM Mono',monospace",fontWeight:600,marginTop:2}}>{a.change>=0?"▲":"▼"} {Math.abs(a.change).toFixed(2)}%</div>
                      </div>}
                    </div>
                    {/* Barre d'insertion APRÈS le dernier item si on drop tout en bas */}
                    {showBarAfter && (
                      <div style={{height:2, background:"#C8A96E", borderRadius:2, margin:"0 0", boxShadow:"0 0 6px #C8A96E80"}}/>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── BANQUE ── */}
          {tab===2 && <BankTab banks={banks} onRemove={id=>setBanks(prev=>prev.filter(b=>b.id!==id))} expandedAccount={expandedAcc} setExpandedAccount={setExpandedAcc}/>}
        </div>

        {/* Ghost drag ACTIFS */}
        {assetGhostItem && (
          <div style={{position:"fixed",left:assetGhostPos.x-175,top:assetGhostPos.y-30,width:350,pointerEvents:"none",zIndex:9999,background:"#1E1B16",border:"1px solid #C8A96E60",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:11,boxShadow:"0 8px 32px #000c",opacity:0.95,transform:"scale(1.04)"}}>
            <div style={{color:"#C8A96E",fontSize:16,flexShrink:0}}>⠿</div>
            <div style={{width:36,height:36,borderRadius:10,background:`${assetGhostItem.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:assetGhostItem.color,border:`1px solid ${assetGhostItem.color}30`,flexShrink:0,fontFamily:"'DM Mono',monospace"}}>{assetGhostItem.symbol.slice(0,2)}</div>
            <div>
              <div style={{color:"#F0EDE8",fontWeight:600,fontSize:13}}>{assetGhostItem.symbol}</div>
              <div style={{color:"#4A4540",fontSize:10,fontFamily:"'DM Mono',monospace"}}>{assetGhostItem.qty} {assetGhostItem.symbol}</div>
            </div>
          </div>
        )}

        {/* Ghost drag element - suit le doigt */}
        {mktGhostItem && (
          <div style={{
            position:"fixed",
            left: mktGhostPos.x - 175,
            top: mktGhostPos.y - 30,
            width: 350,
            pointerEvents:"none",
            zIndex:9999,
            background:"#1E1B16",
            border:"1px solid #C8A96E60",
            borderRadius:12,
            padding:"10px 14px",
            display:"flex",
            alignItems:"center",
            gap:11,
            boxShadow:"0 8px 32px #000c",
            opacity:0.95,
            transform:"scale(1.04)",
          }}>
            <div style={{color:"#C8A96E",fontSize:16,flexShrink:0}}>⠿</div>
            <div style={{width:36,height:36,borderRadius:10,background:`${mktGhostItem.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:mktGhostItem.color,border:`1px solid ${mktGhostItem.color}30`,flexShrink:0,fontFamily:"'DM Mono',monospace"}}>{mktGhostItem.symbol.slice(0,2)}</div>
            <div>
              <div style={{color:"#F0EDE8",fontWeight:600,fontSize:13}}>{mktGhostItem.name||mktGhostItem.symbol}</div>
              <div style={{color:"#4A4540",fontSize:10,fontFamily:"'DM Mono',monospace"}}>{mktGhostItem.symbol}</div>
            </div>
          </div>
        )}

        {/* Panneau ajout marché fixe */}
        {showMktAdd && tab===1 && (
          <div style={{flexShrink:0,background:"#151210",borderTop:"1px solid #2A2520",padding:"12px 20px",zIndex:10}}>
            <div style={{color:"#6A6560",fontSize:10,marginBottom:8,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>Ajouter un symbole</div>
            <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <SymbolSearch value={mktAddSymbol} onChange={v=>{setMktAddSymbol(v);setMktAddError("");}} onSelect={s=>{setMktAddSymbol(s.symbol);setMktAddError("");}} placeholder="ex: DOGE, MSFT, AMZN…" error={mktAddError}/>
              </div>
              <button onClick={handleAddMarket} disabled={mktAddLoading} style={{background:"linear-gradient(135deg,#C8A96E,#A08040)",border:"none",borderRadius:10,padding:"11px 16px",color:"#111009",fontWeight:700,fontSize:13,cursor:"pointer",minWidth:50,flexShrink:0}}>
                {mktAddLoading?"…":"OK"}
              </button>
            </div>
          </div>
        )}

        {/* Bottom Nav */}
        <div style={{flexShrink:0,background:"#111009EE",borderTop:"1px solid #1E1B16",paddingTop:10,paddingLeft:0,paddingRight:0,paddingBottom:"calc(10px + env(safe-area-inset-bottom, 0px))",display:"flex",justifyContent:"space-around",backdropFilter:"blur(24px)"}}>
          {navItems.map(({label,i,icon})=>(
            <button key={label} onClick={()=>{setTab(i);setDetailAsset(null);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",color:tab===i?(i===2?"#4ADE80":"#C8A96E"):"#2A2720",transition:"color 0.2s",fontFamily:"'DM Sans',sans-serif",padding:"0 8px"}}>
              {icon}
              <span style={{fontSize:9,fontWeight:tab===i?700:500,letterSpacing:0.3,textTransform:"uppercase"}}>{label}</span>
              {tab===i&&<div style={{width:16,height:2,borderRadius:1,background:i===2?"#4ADE80":"#C8A96E",marginTop:-2}}/>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Menu Profil (bottom sheet) ── */}
      {showProfileMenu && (
        <div style={{position:"fixed",inset:0,zIndex:1000,background:"#000a",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowProfileMenu(false)}>
          <div style={{width:"100%",maxWidth:430,background:"#1A1714",borderRadius:"24px 24px 0 0",padding:"0 0 calc(16px + env(safe-area-inset-bottom,0px))",border:"1px solid #2A2520",boxShadow:"0 -8px 32px #000d",maxHeight:"85vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            {/* Poignée */}
            <div style={{width:40,height:4,borderRadius:2,background:"#3A3530",margin:"12px auto 0",flexShrink:0}}/>
            {/* Header user */}
            <div style={{padding:"16px 20px 14px",borderBottom:"1px solid #252015",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
              <div style={{width:44,height:44,borderRadius:22,background:"linear-gradient(135deg,#C8A96E,#8B6914)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"#111009",flexShrink:0}}>
                {profileName?profileName[0].toUpperCase():user?.email?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{color:"#F0EDE8",fontSize:14,fontWeight:600}}>{profileName||user?.email?.split("@")[0]}</div>
                <div style={{color:"#4A4540",fontSize:11,marginTop:2}}>{user?.email}</div>
              </div>
            </div>
            {/* Liste portefeuilles scrollable */}
            <div style={{overflowY:"auto",flex:1,padding:"12px 12px 4px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,padding:"0 4px"}}>
                <div style={{color:"#6A6560",fontSize:9,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>Portefeuilles</div>
                <button onClick={()=>setShowAddPortfolio(v=>!v)} style={{background:"#C8A96E20",border:"1px solid #C8A96E40",borderRadius:6,padding:"2px 8px",color:"#C8A96E",fontSize:11,fontWeight:700,cursor:"pointer"}}>+</button>
              </div>
              {showAddPortfolio && (
                <div style={{display:"flex",gap:6,marginBottom:8}}>
                  <input value={newPortfolioName} onChange={e=>setNewPortfolioName(e.target.value)} placeholder="Nom du portefeuille" autoFocus
                    onKeyDown={async e=>{if(e.key==="Enter"&&newPortfolioName.trim()&&userId){await createPortfolio(newPortfolioName.trim(),userId);setNewPortfolioName("");setShowAddPortfolio(false);}}}
                    style={{flex:1,background:"#0E0D0A",border:"1px solid #252015",borderRadius:8,padding:"6px 10px",color:"#F0EDE8",fontSize:12,fontFamily:"'DM Mono',monospace",outline:"none"}}/>
                  <button onClick={async()=>{if(newPortfolioName.trim()&&userId){await createPortfolio(newPortfolioName.trim(),userId);setNewPortfolioName("");setShowAddPortfolio(false);}}}
                    style={{background:"#C8A96E",border:"none",borderRadius:8,padding:"6px 10px",color:"#111009",fontSize:12,fontWeight:700,cursor:"pointer"}}>OK</button>
                </div>
              )}
              {portfolios.map(p=>(
                <div key={p.id} style={{marginBottom:4}}>
                  {editingPortfolioId===p.id ? (
                    <div style={{display:"flex",gap:6}}>
                      <input value={editingPortfolioName} onChange={e=>setEditingPortfolioName(e.target.value)} autoFocus
                        onKeyDown={async e=>{if(e.key==="Enter"&&userId){await renamePortfolioInDB(p.id,editingPortfolioName,userId);setEditingPortfolioId(null);}}}
                        style={{flex:1,background:"#0E0D0A",border:"1px solid #C8A96E40",borderRadius:8,padding:"6px 10px",color:"#F0EDE8",fontSize:12,fontFamily:"'DM Mono',monospace",outline:"none"}}/>
                      <button onClick={async()=>{if(userId){await renamePortfolioInDB(p.id,editingPortfolioName,userId);setEditingPortfolioId(null);}}} style={{background:"#C8A96E",border:"none",borderRadius:8,padding:"6px 10px",color:"#111009",fontSize:12,fontWeight:700,cursor:"pointer"}}>✓</button>
                      <button onClick={()=>setEditingPortfolioId(null)} style={{background:"transparent",border:"1px solid #2A2520",borderRadius:8,padding:"6px 10px",color:"#5A5550",fontSize:12,cursor:"pointer"}}>✕</button>
                    </div>
                  ) : (
                    <div onClick={(e)=>{e.stopPropagation();setShowProfileMenu(false);switchPortfolio(p.id,p.name);}}
                      style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",borderRadius:10,cursor:"pointer",background:activePortfolioId===p.id?"#C8A96E18":"#0E0D0A",border:`1px solid ${activePortfolioId===p.id?"#C8A96E40":"#1E1B16"}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        {activePortfolioId===p.id&&<div style={{width:6,height:6,borderRadius:3,background:"#C8A96E",flexShrink:0}}/>}
                        <span style={{color:activePortfolioId===p.id?"#C8A96E":"#8A8580",fontSize:13,fontWeight:activePortfolioId===p.id?600:400}}>{p.name}</span>
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={e=>{e.stopPropagation();setEditingPortfolioId(p.id);setEditingPortfolioName(p.name);}} style={{background:"transparent",border:"none",color:"#3A3530",fontSize:13,cursor:"pointer",padding:"0 4px"}} onMouseEnter={e=>e.currentTarget.style.color="#C8A96E"} onMouseLeave={e=>e.currentTarget.style.color="#3A3530"}>✏️</button>
                        {portfolios.length>1&&<button onClick={async e=>{e.stopPropagation();if(userId)await deletePortfolioFromDB(p.id,userId);}} style={{background:"transparent",border:"none",color:"#3A3530",fontSize:13,cursor:"pointer",padding:"0 4px"}} onMouseEnter={e=>e.currentTarget.style.color="#F87171"} onMouseLeave={e=>e.currentTarget.style.color="#3A3530"}>✕</button>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Bouton Paramètres */}
            <div data-profile-menu style={{padding:"8px 12px 0",borderTop:"1px solid #252015",flexShrink:0}}>
              <button data-profile-menu onClick={e=>{e.stopPropagation();e.preventDefault();setShowSettings(true);setShowProfileMenu(false);}}
                style={{width:"100%",background:"#1E1B16",border:"1px solid #2A2520",borderRadius:12,padding:"14px 16px",color:"#F0EDE8",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"'DM Sans',sans-serif"}}>
                <span style={{fontSize:18}}>⚙️</span> Paramètres
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <div style={{position:"fixed",inset:0,zIndex:2000,background:"#000a",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowProfileEdit(false)}>
          <div style={{width:"100%",maxWidth:430,background:"#1A1714",borderRadius:"24px 24px 0 0",padding:"24px 20px 40px",border:"1px solid #2A2520"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:40,height:4,borderRadius:2,background:"#3A3530",margin:"0 auto 20px"}}/>
            <div style={{color:"#F0EDE8",fontSize:16,fontWeight:700,marginBottom:20}}>Modifier le profil</div>
            <div style={{marginBottom:14}}>
              <div style={{color:"#6A6560",fontSize:10,marginBottom:6,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>Nom d'affichage</div>
              <input value={editProfileName} onChange={e=>setEditProfileName(e.target.value)} placeholder={user?.email?.split("@")[0]}
                style={{width:"100%",background:"#0E0D0A",border:"1px solid #252015",borderRadius:12,padding:"11px 13px",color:"#F0EDE8",fontSize:13,fontFamily:"'DM Mono',monospace",outline:"none"}}/>
            </div>
            <button onClick={async()=>{
              if(editProfileName&&userId){setProfileName(editProfileName);await saveProfileNameToDB(editProfileName,userId);}
              setShowProfileEdit(false);
            }} style={{width:"100%",background:"linear-gradient(135deg,#C8A96E,#A08040)",border:"none",borderRadius:14,padding:"13px",color:"#111009",fontSize:14,fontWeight:700,cursor:"pointer",marginTop:6}}>
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Paramètres */}
      {showSettings && (
        <div style={{position:"fixed",inset:0,zIndex:2000,background:"#000a",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowSettings(false)}>
          <div style={{width:"100%",maxWidth:430,background:"#1A1714",borderRadius:"24px 24px 0 0",padding:"0 0 calc(24px + env(safe-area-inset-bottom,0px))",border:"1px solid #2A2520",maxHeight:"90vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:40,height:4,borderRadius:2,background:"#3A3530",margin:"12px auto 0",flexShrink:0}}/>
            <div style={{padding:"20px 20px 16px",borderBottom:"1px solid #252015",flexShrink:0}}>
              <div style={{color:"#F0EDE8",fontSize:18,fontWeight:700}}>⚙️ Paramètres</div>
            </div>

            <div style={{overflowY:"auto",flex:1,padding:"20px"}}>

              {/* Modifier le profil */}
              <div style={{marginBottom:24}}>
                <div style={{color:"#6A6560",fontSize:10,marginBottom:12,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>Profil</div>
                <button onClick={()=>{setEditProfileName(profileName);setShowSettings(false);setTimeout(()=>setShowProfileEdit(true),100);}}
                  style={{width:"100%",background:"#0E0D0A",border:"1px solid #252015",borderRadius:12,padding:"14px 16px",color:"#F0EDE8",fontSize:14,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontFamily:"'DM Sans',sans-serif",textAlign:"left"}}>
                  <span style={{fontSize:20}}>✏️</span>
                  <div>
                    <div style={{color:"#F0EDE8",fontSize:13,fontWeight:600}}>Modifier le profil</div>
                    <div style={{color:"#5A5550",fontSize:11,marginTop:2}}>{profileName||user?.email?.split("@")[0]}</div>
                  </div>
                </button>
              </div>

              {/* Durée de session */}
              <div style={{marginBottom:24}}>
                <div style={{color:"#6A6560",fontSize:10,marginBottom:12,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>Durée de connexion</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[
                    {value:"1h",    label:"1 heure"},
                    {value:"6h",    label:"6 heures"},
                    {value:"12h",   label:"12 heures"},
                    {value:"24h",   label:"24 heures"},
                    {value:"always",label:"Toujours connecté"},
                  ].map(opt=>(
                    <div key={opt.value} onClick={async()=>{setSessionDuration(opt.value);if(userId){try{await supabase.from('profiles').upsert({id:userId,session_duration:opt.value,updated_at:new Date().toISOString()});}catch{}}}}
                      style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 16px",borderRadius:12,background:sessionDuration===opt.value?"#C8A96E15":"#0E0D0A",border:`1px solid ${sessionDuration===opt.value?"#C8A96E50":"#252015"}`,cursor:"pointer",transition:"all 0.15s"}}>
                      <span style={{color:sessionDuration===opt.value?"#C8A96E":"#8A8580",fontSize:13,fontWeight:sessionDuration===opt.value?600:400}}>{opt.label}</span>
                      {sessionDuration===opt.value&&<div style={{width:8,height:8,borderRadius:4,background:"#C8A96E"}}/>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Déconnexion */}
              <div>
                <div style={{color:"#6A6560",fontSize:10,marginBottom:12,fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>Compte</div>
                <button onClick={()=>{setShowSettings(false);handleLogout();}}
                  style={{width:"100%",background:"#F8717110",border:"1px solid #F8717130",borderRadius:12,padding:"14px 16px",color:"#F87171",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontFamily:"'DM Sans',sans-serif"}}>
                  <span style={{fontSize:20}}>⏻</span> Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal&&<AddAssetModal onClose={()=>setShowAddModal(false)} onAdd={handleAddAsset}/>}
      {syncedDetailAsset&&<AssetDetailSheet asset={syncedDetailAsset} fmt={fmt} onClose={()=>setDetailAsset(null)} onAddDividend={handleAddDividend} onDelete={handleDeleteAsset} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction}/>}
    </div>
  );
}
