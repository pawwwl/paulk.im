"use client";

import { useEffect, useRef, useState } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const GAP = 12;
function cellSize() {
  return window.innerWidth < 640 ? 120 : 200;
}
const RADIUS = 8;
const FRICTION = 0.92;

// ── Top 50 cities per continent ───────────────────────────────────────────────
// continent: na · sa · af · eu · as · oc
const CITIES = [
  // ── North America ──────────────────────────────────────────────────────────
  {
    name: "Mexico City",
    country: "MX",
    continent: "na",
    lat: 19.43,
    lon: -99.13,
  },
  { name: "New York", country: "US", continent: "na", lat: 40.71, lon: -74.01 },
  {
    name: "Los Angeles",
    country: "US",
    continent: "na",
    lat: 34.05,
    lon: -118.24,
  },
  { name: "Chicago", country: "US", continent: "na", lat: 41.88, lon: -87.63 },
  { name: "Toronto", country: "CA", continent: "na", lat: 43.65, lon: -79.38 },
  { name: "Houston", country: "US", continent: "na", lat: 29.76, lon: -95.37 },
  {
    name: "Guadalajara",
    country: "MX",
    continent: "na",
    lat: 20.67,
    lon: -103.35,
  },
  { name: "Havana", country: "CU", continent: "na", lat: 23.14, lon: -82.36 },
  {
    name: "Monterrey",
    country: "MX",
    continent: "na",
    lat: 25.67,
    lon: -100.31,
  },
  {
    name: "Philadelphia",
    country: "US",
    continent: "na",
    lat: 39.95,
    lon: -75.17,
  },
  { name: "Phoenix", country: "US", continent: "na", lat: 33.45, lon: -112.07 },
  { name: "Montreal", country: "CA", continent: "na", lat: 45.51, lon: -73.55 },
  { name: "Puebla", country: "MX", continent: "na", lat: 19.04, lon: -98.21 },
  {
    name: "San Antonio",
    country: "US",
    continent: "na",
    lat: 29.42,
    lon: -98.49,
  },
  { name: "Dallas", country: "US", continent: "na", lat: 32.79, lon: -96.77 },
  {
    name: "San Diego",
    country: "US",
    continent: "na",
    lat: 32.72,
    lon: -117.16,
  },
  { name: "Austin", country: "US", continent: "na", lat: 30.27, lon: -97.74 },
  {
    name: "San Jose",
    country: "US",
    continent: "na",
    lat: 37.34,
    lon: -121.89,
  },
  {
    name: "Jacksonville",
    country: "US",
    continent: "na",
    lat: 30.33,
    lon: -81.66,
  },
  { name: "Seattle", country: "US", continent: "na", lat: 47.61, lon: -122.33 },
  {
    name: "San Francisco",
    country: "US",
    continent: "na",
    lat: 37.77,
    lon: -122.42,
  },
  { name: "Columbus", country: "US", continent: "na", lat: 39.96, lon: -82.99 },
  { name: "Denver", country: "US", continent: "na", lat: 39.74, lon: -104.98 },
  {
    name: "Washington DC",
    country: "US",
    continent: "na",
    lat: 38.91,
    lon: -77.04,
  },
  {
    name: "Nashville",
    country: "US",
    continent: "na",
    lat: 36.17,
    lon: -86.78,
  },
  { name: "Boston", country: "US", continent: "na", lat: 42.36, lon: -71.06 },
  {
    name: "Las Vegas",
    country: "US",
    continent: "na",
    lat: 36.17,
    lon: -115.14,
  },
  {
    name: "Portland",
    country: "US",
    continent: "na",
    lat: 45.52,
    lon: -122.67,
  },
  {
    name: "Charlotte",
    country: "US",
    continent: "na",
    lat: 35.23,
    lon: -80.84,
  },
  {
    name: "Indianapolis",
    country: "US",
    continent: "na",
    lat: 39.77,
    lon: -86.16,
  },
  {
    name: "Baltimore",
    country: "US",
    continent: "na",
    lat: 39.29,
    lon: -76.61,
  },
  { name: "Memphis", country: "US", continent: "na", lat: 35.15, lon: -90.05 },
  {
    name: "Louisville",
    country: "US",
    continent: "na",
    lat: 38.25,
    lon: -85.76,
  },
  {
    name: "Milwaukee",
    country: "US",
    continent: "na",
    lat: 43.04,
    lon: -87.91,
  },
  {
    name: "Vancouver",
    country: "CA",
    continent: "na",
    lat: 49.25,
    lon: -123.12,
  },
  { name: "Ottawa", country: "CA", continent: "na", lat: 45.42, lon: -75.7 },
  { name: "Calgary", country: "CA", continent: "na", lat: 51.05, lon: -114.07 },
  {
    name: "Edmonton",
    country: "CA",
    continent: "na",
    lat: 53.55,
    lon: -113.47,
  },
  { name: "Winnipeg", country: "CA", continent: "na", lat: 49.9, lon: -97.14 },
  {
    name: "Guatemala City",
    country: "GT",
    continent: "na",
    lat: 14.64,
    lon: -90.51,
  },
  {
    name: "Santo Domingo",
    country: "DO",
    continent: "na",
    lat: 18.48,
    lon: -69.9,
  },
  {
    name: "San Salvador",
    country: "SV",
    continent: "na",
    lat: 13.7,
    lon: -89.2,
  },
  {
    name: "Tegucigalpa",
    country: "HN",
    continent: "na",
    lat: 14.1,
    lon: -87.22,
  },
  {
    name: "Port-au-Prince",
    country: "HT",
    continent: "na",
    lat: 18.54,
    lon: -72.34,
  },
  {
    name: "Panama City",
    country: "PA",
    continent: "na",
    lat: 8.99,
    lon: -79.52,
  },
  { name: "Managua", country: "NI", continent: "na", lat: 12.13, lon: -86.28 },
  { name: "San José", country: "CR", continent: "na", lat: 9.93, lon: -84.08 },
  { name: "Kingston", country: "JM", continent: "na", lat: 17.99, lon: -76.79 },
  { name: "San Juan", country: "PR", continent: "na", lat: 18.47, lon: -66.11 },
  {
    name: "Fort Worth",
    country: "US",
    continent: "na",
    lat: 32.72,
    lon: -97.32,
  },

  // ── South America ──────────────────────────────────────────────────────────
  {
    name: "São Paulo",
    country: "BR",
    continent: "sa",
    lat: -23.55,
    lon: -46.63,
  },
  {
    name: "Buenos Aires",
    country: "AR",
    continent: "sa",
    lat: -34.6,
    lon: -58.38,
  },
  {
    name: "Rio de Janeiro",
    country: "BR",
    continent: "sa",
    lat: -22.91,
    lon: -43.17,
  },
  { name: "Lima", country: "PE", continent: "sa", lat: -12.05, lon: -77.04 },
  { name: "Bogota", country: "CO", continent: "sa", lat: 4.71, lon: -74.07 },
  {
    name: "Santiago",
    country: "CL",
    continent: "sa",
    lat: -33.46,
    lon: -70.65,
  },
  { name: "Caracas", country: "VE", continent: "sa", lat: 10.48, lon: -66.9 },
  {
    name: "Belo Horizonte",
    country: "BR",
    continent: "sa",
    lat: -19.92,
    lon: -43.94,
  },
  {
    name: "Brasilia",
    country: "BR",
    continent: "sa",
    lat: -15.78,
    lon: -47.93,
  },
  { name: "Medellín", country: "CO", continent: "sa", lat: 6.25, lon: -75.56 },
  {
    name: "Fortaleza",
    country: "BR",
    continent: "sa",
    lat: -3.72,
    lon: -38.54,
  },
  {
    name: "Guayaquil",
    country: "EC",
    continent: "sa",
    lat: -2.19,
    lon: -79.89,
  },
  { name: "Cali", country: "CO", continent: "sa", lat: 3.43, lon: -76.52 },
  { name: "Manaus", country: "BR", continent: "sa", lat: -3.1, lon: -60.03 },
  { name: "Recife", country: "BR", continent: "sa", lat: -8.05, lon: -34.88 },
  {
    name: "Curitiba",
    country: "BR",
    continent: "sa",
    lat: -25.43,
    lon: -49.27,
  },
  {
    name: "Maracaibo",
    country: "VE",
    continent: "sa",
    lat: 10.66,
    lon: -71.61,
  },
  {
    name: "Porto Alegre",
    country: "BR",
    continent: "sa",
    lat: -30.03,
    lon: -51.23,
  },
  { name: "Quito", country: "EC", continent: "sa", lat: -0.22, lon: -78.51 },
  {
    name: "Montevideo",
    country: "UY",
    continent: "sa",
    lat: -34.9,
    lon: -56.19,
  },
  { name: "Belém", country: "BR", continent: "sa", lat: -1.45, lon: -48.5 },
  {
    name: "Salvador",
    country: "BR",
    continent: "sa",
    lat: -12.97,
    lon: -38.51,
  },
  { name: "La Paz", country: "BO", continent: "sa", lat: -16.5, lon: -68.15 },
  { name: "Rosario", country: "AR", continent: "sa", lat: -32.95, lon: -60.64 },
  {
    name: "Asuncion",
    country: "PY",
    continent: "sa",
    lat: -25.29,
    lon: -57.65,
  },
  { name: "Córdoba", country: "AR", continent: "sa", lat: -31.42, lon: -64.19 },
  {
    name: "Santa Cruz",
    country: "BO",
    continent: "sa",
    lat: -17.8,
    lon: -63.17,
  },
  { name: "Goiânia", country: "BR", continent: "sa", lat: -16.69, lon: -49.25 },
  {
    name: "Campinas",
    country: "BR",
    continent: "sa",
    lat: -22.91,
    lon: -47.06,
  },
  {
    name: "Guarulhos",
    country: "BR",
    continent: "sa",
    lat: -23.46,
    lon: -46.53,
  },
  {
    name: "Barranquilla",
    country: "CO",
    continent: "sa",
    lat: 10.96,
    lon: -74.8,
  },
  {
    name: "Florianópolis",
    country: "BR",
    continent: "sa",
    lat: -27.6,
    lon: -48.55,
  },
  { name: "Natal", country: "BR", continent: "sa", lat: -5.8, lon: -35.21 },
  { name: "Cúcuta", country: "CO", continent: "sa", lat: 7.89, lon: -72.5 },
  { name: "Maceió", country: "BR", continent: "sa", lat: -9.67, lon: -35.74 },
  { name: "Teresina", country: "BR", continent: "sa", lat: -5.09, lon: -42.8 },
  {
    name: "Campo Grande",
    country: "BR",
    continent: "sa",
    lat: -20.46,
    lon: -54.62,
  },
  {
    name: "João Pessoa",
    country: "BR",
    continent: "sa",
    lat: -7.12,
    lon: -34.88,
  },
  { name: "Aracaju", country: "BR", continent: "sa", lat: -10.91, lon: -37.05 },
  {
    name: "Uberlândia",
    country: "BR",
    continent: "sa",
    lat: -18.92,
    lon: -48.28,
  },
  { name: "Sorocaba", country: "BR", continent: "sa", lat: -23.5, lon: -47.46 },
  {
    name: "Contagem",
    country: "BR",
    continent: "sa",
    lat: -19.93,
    lon: -44.05,
  },
  {
    name: "Ribeirão Preto",
    country: "BR",
    continent: "sa",
    lat: -21.17,
    lon: -47.81,
  },
  {
    name: "Porto Velho",
    country: "BR",
    continent: "sa",
    lat: -8.76,
    lon: -63.9,
  },
  { name: "Pelotas", country: "BR", continent: "sa", lat: -31.77, lon: -52.34 },
  {
    name: "Duque de Caxias",
    country: "BR",
    continent: "sa",
    lat: -22.79,
    lon: -43.31,
  },
  {
    name: "Nova Iguaçu",
    country: "BR",
    continent: "sa",
    lat: -22.76,
    lon: -43.45,
  },
  { name: "Mendoza", country: "AR", continent: "sa", lat: -32.89, lon: -68.84 },
  { name: "Osasco", country: "BR", continent: "sa", lat: -23.53, lon: -46.79 },
  { name: "Paraná", country: "AR", continent: "sa", lat: -31.73, lon: -60.53 },
  {
    name: "Mar del Plata",
    country: "AR",
    continent: "sa",
    lat: -38.0,
    lon: -57.56,
  },

  // ── Africa ─────────────────────────────────────────────────────────────────
  { name: "Lagos", country: "NG", continent: "af", lat: 6.45, lon: 3.39 },
  { name: "Cairo", country: "EG", continent: "af", lat: 30.06, lon: 31.25 },
  { name: "Kinshasa", country: "CD", continent: "af", lat: -4.32, lon: 15.32 },
  { name: "Luanda", country: "AO", continent: "af", lat: -8.84, lon: 13.23 },
  { name: "Kano", country: "NG", continent: "af", lat: 12.0, lon: 8.52 },
  {
    name: "Dar es Salaam",
    country: "TZ",
    continent: "af",
    lat: -6.8,
    lon: 39.27,
  },
  { name: "Abidjan", country: "CI", continent: "af", lat: 5.36, lon: -4.01 },
  { name: "Khartoum", country: "SD", continent: "af", lat: 15.55, lon: 32.53 },
  { name: "Alexandria", country: "EG", continent: "af", lat: 31.2, lon: 29.92 },
  {
    name: "Johannesburg",
    country: "ZA",
    continent: "af",
    lat: -26.2,
    lon: 28.04,
  },
  {
    name: "Addis Ababa",
    country: "ET",
    continent: "af",
    lat: 9.03,
    lon: 38.74,
  },
  { name: "Ibadan", country: "NG", continent: "af", lat: 7.38, lon: 3.9 },
  { name: "Nairobi", country: "KE", continent: "af", lat: -1.29, lon: 36.82 },
  {
    name: "Antananarivo",
    country: "MG",
    continent: "af",
    lat: -18.91,
    lon: 47.54,
  },
  {
    name: "Casablanca",
    country: "MA",
    continent: "af",
    lat: 33.59,
    lon: -7.62,
  },
  { name: "Douala", country: "CM", continent: "af", lat: 4.05, lon: 9.7 },
  { name: "Algiers", country: "DZ", continent: "af", lat: 36.74, lon: 3.06 },
  { name: "Mogadishu", country: "SO", continent: "af", lat: 2.05, lon: 45.34 },
  { name: "Abuja", country: "NG", continent: "af", lat: 9.07, lon: 7.4 },
  { name: "Accra", country: "GH", continent: "af", lat: 5.56, lon: -0.2 },
  { name: "Kampala", country: "UG", continent: "af", lat: 0.32, lon: 32.58 },
  { name: "Dakar", country: "SN", continent: "af", lat: 14.69, lon: -17.44 },
  { name: "Yaoundé", country: "CM", continent: "af", lat: 3.86, lon: 11.52 },
  { name: "Tunis", country: "TN", continent: "af", lat: 36.82, lon: 10.17 },
  {
    name: "Cape Town",
    country: "ZA",
    continent: "af",
    lat: -33.93,
    lon: 18.42,
  },
  { name: "Conakry", country: "GN", continent: "af", lat: 9.54, lon: -13.68 },
  { name: "Lusaka", country: "ZM", continent: "af", lat: -15.42, lon: 28.28 },
  { name: "Durban", country: "ZA", continent: "af", lat: -29.86, lon: 31.02 },
  { name: "Bamako", country: "ML", continent: "af", lat: 12.65, lon: -8.0 },
  { name: "Harare", country: "ZW", continent: "af", lat: -17.83, lon: 31.05 },
  {
    name: "Ouagadougou",
    country: "BF",
    continent: "af",
    lat: 12.37,
    lon: -1.53,
  },
  { name: "Tripoli", country: "LY", continent: "af", lat: 32.9, lon: 13.18 },
  { name: "Maputo", country: "MZ", continent: "af", lat: -25.97, lon: 32.59 },
  { name: "Lomé", country: "TG", continent: "af", lat: 6.13, lon: 1.22 },
  { name: "Freetown", country: "SL", continent: "af", lat: 8.49, lon: -13.23 },
  { name: "Kigali", country: "RW", continent: "af", lat: -1.94, lon: 30.06 },
  { name: "Mombasa", country: "KE", continent: "af", lat: -4.05, lon: 39.66 },
  { name: "Niamey", country: "NE", continent: "af", lat: 13.51, lon: 2.12 },
  { name: "Ndjamena", country: "TD", continent: "af", lat: 12.11, lon: 15.04 },
  { name: "Bangui", country: "CF", continent: "af", lat: 4.36, lon: 18.56 },
  {
    name: "Brazzaville",
    country: "CG",
    continent: "af",
    lat: -4.27,
    lon: 15.28,
  },
  { name: "Libreville", country: "GA", continent: "af", lat: 0.39, lon: 9.45 },
  { name: "Asmara", country: "ER", continent: "af", lat: 15.33, lon: 38.93 },
  { name: "Djibouti", country: "DJ", continent: "af", lat: 11.59, lon: 43.15 },
  { name: "Bujumbura", country: "BI", continent: "af", lat: -3.38, lon: 29.36 },
  { name: "Lilongwe", country: "MW", continent: "af", lat: -13.97, lon: 33.79 },
  { name: "Gaborone", country: "BW", continent: "af", lat: -24.65, lon: 25.91 },
  { name: "Windhoek", country: "NA", continent: "af", lat: -22.56, lon: 17.08 },
  {
    name: "Port Louis",
    country: "MU",
    continent: "af",
    lat: -20.16,
    lon: 57.49,
  },
  { name: "Malabo", country: "GQ", continent: "af", lat: 3.75, lon: 8.78 },
  { name: "Moroni", country: "KM", continent: "af", lat: -11.7, lon: 43.26 },

  // ── Europe ─────────────────────────────────────────────────────────────────
  { name: "Istanbul", country: "TR", continent: "eu", lat: 41.01, lon: 28.95 },
  { name: "Moscow", country: "RU", continent: "eu", lat: 55.75, lon: 37.62 },
  { name: "London", country: "GB", continent: "eu", lat: 51.51, lon: -0.13 },
  { name: "Paris", country: "FR", continent: "eu", lat: 48.85, lon: 2.35 },
  { name: "Berlin", country: "DE", continent: "eu", lat: 52.52, lon: 13.41 },
  { name: "Madrid", country: "ES", continent: "eu", lat: 40.42, lon: -3.7 },
  { name: "Kyiv", country: "UA", continent: "eu", lat: 50.45, lon: 30.52 },
  { name: "Rome", country: "IT", continent: "eu", lat: 41.9, lon: 12.48 },
  { name: "Bucharest", country: "RO", continent: "eu", lat: 44.43, lon: 26.1 },
  { name: "Amsterdam", country: "NL", continent: "eu", lat: 52.37, lon: 4.9 },
  { name: "Warsaw", country: "PL", continent: "eu", lat: 52.23, lon: 21.01 },
  { name: "Vienna", country: "AT", continent: "eu", lat: 48.21, lon: 16.37 },
  { name: "Hamburg", country: "DE", continent: "eu", lat: 53.55, lon: 10.0 },
  { name: "Budapest", country: "HU", continent: "eu", lat: 47.5, lon: 19.04 },
  { name: "Barcelona", country: "ES", continent: "eu", lat: 41.39, lon: 2.15 },
  { name: "Munich", country: "DE", continent: "eu", lat: 48.14, lon: 11.58 },
  { name: "Milan", country: "IT", continent: "eu", lat: 45.46, lon: 9.19 },
  { name: "Belgrade", country: "RS", continent: "eu", lat: 44.8, lon: 20.47 },
  { name: "Stockholm", country: "SE", continent: "eu", lat: 59.33, lon: 18.07 },
  { name: "Prague", country: "CZ", continent: "eu", lat: 50.08, lon: 14.44 },
  {
    name: "Copenhagen",
    country: "DK",
    continent: "eu",
    lat: 55.68,
    lon: 12.57,
  },
  { name: "Brussels", country: "BE", continent: "eu", lat: 50.85, lon: 4.35 },
  { name: "Athens", country: "GR", continent: "eu", lat: 37.98, lon: 23.73 },
  { name: "Oslo", country: "NO", continent: "eu", lat: 59.91, lon: 10.75 },
  { name: "Minsk", country: "BY", continent: "eu", lat: 53.9, lon: 27.57 },
  { name: "Helsinki", country: "FI", continent: "eu", lat: 60.17, lon: 24.94 },
  { name: "Zurich", country: "CH", continent: "eu", lat: 47.38, lon: 8.54 },
  { name: "Dublin", country: "IE", continent: "eu", lat: 53.34, lon: -6.27 },
  { name: "Tbilisi", country: "GE", continent: "eu", lat: 41.69, lon: 44.83 },
  { name: "Baku", country: "AZ", continent: "eu", lat: 40.41, lon: 49.87 },
  { name: "Lisbon", country: "PT", continent: "eu", lat: 38.72, lon: -9.14 },
  { name: "Lyon", country: "FR", continent: "eu", lat: 45.76, lon: 4.84 },
  { name: "Sofia", country: "BG", continent: "eu", lat: 42.7, lon: 23.32 },
  { name: "Rotterdam", country: "NL", continent: "eu", lat: 51.92, lon: 4.48 },
  { name: "Frankfurt", country: "DE", continent: "eu", lat: 50.11, lon: 8.68 },
  { name: "Zagreb", country: "HR", continent: "eu", lat: 45.81, lon: 15.98 },
  { name: "Vilnius", country: "LT", continent: "eu", lat: 54.69, lon: 25.28 },
  { name: "Riga", country: "LV", continent: "eu", lat: 56.95, lon: 24.11 },
  { name: "Tallinn", country: "EE", continent: "eu", lat: 59.44, lon: 24.75 },
  {
    name: "Bratislava",
    country: "SK",
    continent: "eu",
    lat: 48.15,
    lon: 17.11,
  },
  { name: "Yerevan", country: "AM", continent: "eu", lat: 40.18, lon: 44.51 },
  { name: "Ljubljana", country: "SI", continent: "eu", lat: 46.05, lon: 14.51 },
  { name: "Sarajevo", country: "BA", continent: "eu", lat: 43.85, lon: 18.36 },
  { name: "Tirana", country: "AL", continent: "eu", lat: 41.33, lon: 19.83 },
  { name: "Skopje", country: "MK", continent: "eu", lat: 42.0, lon: 21.43 },
  { name: "Chisinau", country: "MD", continent: "eu", lat: 47.0, lon: 28.86 },
  { name: "Podgorica", country: "ME", continent: "eu", lat: 42.44, lon: 19.26 },
  {
    name: "Reykjavik",
    country: "IS",
    continent: "eu",
    lat: 64.14,
    lon: -21.94,
  },
  { name: "Nicosia", country: "CY", continent: "eu", lat: 35.17, lon: 33.37 },
  { name: "Valletta", country: "MT", continent: "eu", lat: 35.9, lon: 14.51 },
  { name: "Cologne", country: "DE", continent: "eu", lat: 50.94, lon: 6.96 },

  // ── Asia ───────────────────────────────────────────────────────────────────
  { name: "Tokyo", country: "JP", continent: "as", lat: 35.69, lon: 139.69 },
  { name: "Delhi", country: "IN", continent: "as", lat: 28.66, lon: 77.21 },
  { name: "Shanghai", country: "CN", continent: "as", lat: 31.23, lon: 121.47 },
  { name: "Mumbai", country: "IN", continent: "as", lat: 19.08, lon: 72.88 },
  { name: "Beijing", country: "CN", continent: "as", lat: 39.91, lon: 116.39 },
  { name: "Dhaka", country: "BD", continent: "as", lat: 23.72, lon: 90.41 },
  { name: "Karachi", country: "PK", continent: "as", lat: 24.86, lon: 67.01 },
  {
    name: "Chongqing",
    country: "CN",
    continent: "as",
    lat: 29.56,
    lon: 106.55,
  },
  { name: "Osaka", country: "JP", continent: "as", lat: 34.69, lon: 135.5 },
  { name: "Lahore", country: "PK", continent: "as", lat: 31.55, lon: 74.34 },
  { name: "Kolkata", country: "IN", continent: "as", lat: 22.57, lon: 88.36 },
  { name: "Bangkok", country: "TH", continent: "as", lat: 13.75, lon: 100.52 },
  { name: "Tianjin", country: "CN", continent: "as", lat: 39.14, lon: 117.18 },
  {
    name: "Guangzhou",
    country: "CN",
    continent: "as",
    lat: 23.13,
    lon: 113.26,
  },
  { name: "Jakarta", country: "ID", continent: "as", lat: -6.21, lon: 106.85 },
  { name: "Seoul", country: "KR", continent: "as", lat: 37.57, lon: 126.98 },
  { name: "Shenzhen", country: "CN", continent: "as", lat: 22.54, lon: 114.06 },
  { name: "Bangalore", country: "IN", continent: "as", lat: 12.97, lon: 77.59 },
  {
    name: "Hong Kong",
    country: "HK",
    continent: "as",
    lat: 22.32,
    lon: 114.17,
  },
  { name: "Tehran", country: "IR", continent: "as", lat: 35.69, lon: 51.39 },
  { name: "Singapore", country: "SG", continent: "as", lat: 1.35, lon: 103.82 },
  { name: "Wuhan", country: "CN", continent: "as", lat: 30.58, lon: 114.27 },
  { name: "Chengdu", country: "CN", continent: "as", lat: 30.66, lon: 104.07 },
  { name: "Nanjing", country: "CN", continent: "as", lat: 32.06, lon: 118.78 },
  { name: "Hyderabad", country: "IN", continent: "as", lat: 17.38, lon: 78.49 },
  {
    name: "Ho Chi Minh City",
    country: "VN",
    continent: "as",
    lat: 10.82,
    lon: 106.63,
  },
  { name: "Ahmedabad", country: "IN", continent: "as", lat: 23.03, lon: 72.58 },
  { name: "Hanoi", country: "VN", continent: "as", lat: 21.03, lon: 105.83 },
  {
    name: "Kuala Lumpur",
    country: "MY",
    continent: "as",
    lat: 3.14,
    lon: 101.69,
  },
  { name: "Manila", country: "PH", continent: "as", lat: 14.6, lon: 120.98 },
  { name: "Dubai", country: "AE", continent: "as", lat: 25.2, lon: 55.27 },
  { name: "Riyadh", country: "SA", continent: "as", lat: 24.69, lon: 46.72 },
  { name: "Taipei", country: "TW", continent: "as", lat: 25.05, lon: 121.53 },
  { name: "Yangon", country: "MM", continent: "as", lat: 16.87, lon: 96.19 },
  { name: "Kabul", country: "AF", continent: "as", lat: 34.53, lon: 69.17 },
  { name: "Baghdad", country: "IQ", continent: "as", lat: 33.33, lon: 44.4 },
  { name: "Colombo", country: "LK", continent: "as", lat: 6.93, lon: 79.86 },
  { name: "Kathmandu", country: "NP", continent: "as", lat: 27.72, lon: 85.32 },
  { name: "Islamabad", country: "PK", continent: "as", lat: 33.72, lon: 73.06 },
  { name: "Tashkent", country: "UZ", continent: "as", lat: 41.3, lon: 69.27 },
  {
    name: "Ulaanbaatar",
    country: "MN",
    continent: "as",
    lat: 47.91,
    lon: 106.88,
  },
  {
    name: "Phnom Penh",
    country: "KH",
    continent: "as",
    lat: 11.55,
    lon: 104.92,
  },
  { name: "Vientiane", country: "LA", continent: "as", lat: 17.97, lon: 102.6 },
  { name: "Muscat", country: "OM", continent: "as", lat: 23.61, lon: 58.59 },
  { name: "Amman", country: "JO", continent: "as", lat: 31.96, lon: 35.95 },
  { name: "Bishkek", country: "KG", continent: "as", lat: 42.87, lon: 74.59 },
  { name: "Almaty", country: "KZ", continent: "as", lat: 43.27, lon: 76.92 },
  { name: "Dushanbe", country: "TJ", continent: "as", lat: 38.56, lon: 68.77 },
  { name: "Ashgabat", country: "TM", continent: "as", lat: 37.95, lon: 58.38 },
  {
    name: "Pyongyang",
    country: "KP",
    continent: "as",
    lat: 39.03,
    lon: 125.75,
  },
  { name: "Beirut", country: "LB", continent: "as", lat: 33.89, lon: 35.5 },

  // ── Oceania ────────────────────────────────────────────────────────────────
  { name: "Sydney", country: "AU", continent: "oc", lat: -33.87, lon: 151.21 },
  {
    name: "Melbourne",
    country: "AU",
    continent: "oc",
    lat: -37.81,
    lon: 144.96,
  },
  {
    name: "Brisbane",
    country: "AU",
    continent: "oc",
    lat: -27.47,
    lon: 153.03,
  },
  { name: "Perth", country: "AU", continent: "oc", lat: -31.95, lon: 115.86 },
  {
    name: "Auckland",
    country: "NZ",
    continent: "oc",
    lat: -36.87,
    lon: 174.77,
  },
  { name: "Adelaide", country: "AU", continent: "oc", lat: -34.93, lon: 138.6 },
  {
    name: "Gold Coast",
    country: "AU",
    continent: "oc",
    lat: -28.0,
    lon: 153.43,
  },
  {
    name: "Wellington",
    country: "NZ",
    continent: "oc",
    lat: -41.29,
    lon: 174.78,
  },
  {
    name: "Canberra",
    country: "AU",
    continent: "oc",
    lat: -35.28,
    lon: 149.13,
  },
  {
    name: "Newcastle",
    country: "AU",
    continent: "oc",
    lat: -32.93,
    lon: 151.78,
  },
  {
    name: "Port Moresby",
    country: "PG",
    continent: "oc",
    lat: -9.44,
    lon: 147.18,
  },
  {
    name: "Christchurch",
    country: "NZ",
    continent: "oc",
    lat: -43.53,
    lon: 172.64,
  },
  {
    name: "Wollongong",
    country: "AU",
    continent: "oc",
    lat: -34.43,
    lon: 150.89,
  },
  { name: "Geelong", country: "AU", continent: "oc", lat: -38.15, lon: 144.36 },
  { name: "Hobart", country: "AU", continent: "oc", lat: -42.88, lon: 147.33 },
  {
    name: "Townsville",
    country: "AU",
    continent: "oc",
    lat: -19.26,
    lon: 146.82,
  },
  { name: "Darwin", country: "AU", continent: "oc", lat: -12.46, lon: 130.84 },
  { name: "Cairns", country: "AU", continent: "oc", lat: -16.92, lon: 145.78 },
  {
    name: "Hamilton",
    country: "NZ",
    continent: "oc",
    lat: -37.79,
    lon: 175.28,
  },
  {
    name: "Tauranga",
    country: "NZ",
    continent: "oc",
    lat: -37.69,
    lon: 176.17,
  },
  {
    name: "Sunshine Coast",
    country: "AU",
    continent: "oc",
    lat: -26.65,
    lon: 153.07,
  },
  { name: "Dunedin", country: "NZ", continent: "oc", lat: -45.88, lon: 170.5 },
  {
    name: "Palmerston North",
    country: "NZ",
    continent: "oc",
    lat: -40.36,
    lon: 175.61,
  },
  { name: "Suva", country: "FJ", continent: "oc", lat: -18.14, lon: 178.44 },
  {
    name: "Toowoomba",
    country: "AU",
    continent: "oc",
    lat: -27.56,
    lon: 151.95,
  },
  {
    name: "Launceston",
    country: "AU",
    continent: "oc",
    lat: -41.44,
    lon: 147.14,
  },
  {
    name: "Ballarat",
    country: "AU",
    continent: "oc",
    lat: -37.56,
    lon: 143.86,
  },
  { name: "Bendigo", country: "AU", continent: "oc", lat: -36.76, lon: 144.28 },
  { name: "Rotorua", country: "NZ", continent: "oc", lat: -38.14, lon: 176.25 },
  { name: "Napier", country: "NZ", continent: "oc", lat: -39.49, lon: 176.91 },
  {
    name: "Honolulu",
    country: "US",
    continent: "oc",
    lat: 21.31,
    lon: -157.86,
  },
  {
    name: "Papeete",
    country: "PF",
    continent: "oc",
    lat: -17.54,
    lon: -149.57,
  },
  { name: "Honiara", country: "SB", continent: "oc", lat: -9.44, lon: 160.03 },
  {
    name: "Port Vila",
    country: "VU",
    continent: "oc",
    lat: -17.73,
    lon: 168.32,
  },
  { name: "Noumea", country: "NC", continent: "oc", lat: -22.27, lon: 166.46 },
  { name: "Nadi", country: "FJ", continent: "oc", lat: -17.8, lon: 177.41 },
  { name: "Apia", country: "WS", continent: "oc", lat: -13.83, lon: -171.77 },
  {
    name: "Nuku'alofa",
    country: "TO",
    continent: "oc",
    lat: -21.14,
    lon: -175.22,
  },
  { name: "Lae", country: "PG", continent: "oc", lat: -6.73, lon: 147.0 },
  { name: "Nelson", country: "NZ", continent: "oc", lat: -41.27, lon: 173.28 },
  { name: "Mackay", country: "AU", continent: "oc", lat: -21.15, lon: 149.19 },
  {
    name: "Rockhampton",
    country: "AU",
    continent: "oc",
    lat: -23.38,
    lon: 150.51,
  },
  { name: "Manukau", country: "NZ", continent: "oc", lat: -36.99, lon: 174.88 },
  { name: "Bunbury", country: "AU", continent: "oc", lat: -33.33, lon: 115.64 },
  { name: "Dili", country: "TL", continent: "oc", lat: -8.56, lon: 125.58 },
  { name: "Majuro", country: "MH", continent: "oc", lat: 7.09, lon: 171.38 },
  { name: "Tarawa", country: "KI", continent: "oc", lat: 1.33, lon: 172.98 },
  { name: "Palikir", country: "FM", continent: "oc", lat: 6.92, lon: 158.16 },
  { name: "Funafuti", country: "TV", continent: "oc", lat: -8.52, lon: 179.2 },
  { name: "Koror", country: "PW", continent: "oc", lat: 7.34, lon: 134.49 },
] as const;

const CONTINENT_TAGS = [
  { id: "na", label: "North America" },
  { id: "sa", label: "South America" },
  { id: "af", label: "Africa" },
  { id: "eu", label: "Europe" },
  { id: "as", label: "Asia" },
] as const;

type City = (typeof CITIES)[number];

type WeatherData = {
  city: City;
  temp: number; // celsius, parsed from "21 °C"
  windKph: number; // parsed from "6 km/h"
  description: string; // raw e.g. "Partly cloudy"
};

// ── Description-based helpers ─────────────────────────────────────────────────
type WeatherCat = "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";

function weatherCat(desc: string): WeatherCat {
  const d = desc.toLowerCase();
  if (d.includes("thunder") || d.includes("storm")) return "storm";
  if (d.includes("snow") || d.includes("blizzard") || d.includes("sleet"))
    return "snow";
  if (d.includes("rain") || d.includes("drizzle") || d.includes("shower"))
    return "rain";
  if (d.includes("fog") || d.includes("mist") || d.includes("haze"))
    return "fog";
  if (d.includes("cloud") || d.includes("overcast")) return "cloudy";
  if (d.includes("clear") || d.includes("sunny") || d.includes("sun"))
    return "clear";
  return "cloudy";
}

function weatherEmoji(desc: string): string {
  return {
    clear: "☀",
    cloudy: "⛅",
    fog: "🌫",
    rain: "🌧",
    snow: "❄",
    storm: "⛈",
  }[weatherCat(desc)];
}

// ── Color palettes per condition ──────────────────────────────────────────────
const PALETTES: Record<
  WeatherCat,
  { bg0: string; bg1: string; accent: string }
> = {
  clear: { bg0: "#1a0a00", bg1: "#3a1800", accent: "#f5a830" },
  cloudy: { bg0: "#0a0d14", bg1: "#15202e", accent: "#7ba3c8" },
  fog: { bg0: "#0d0d0d", bg1: "#1e1e1e", accent: "#9ea8b4" },
  rain: { bg0: "#000d1a", bg1: "#001630", accent: "#4d96d9" },
  snow: { bg0: "#08101a", bg1: "#0f1e38", accent: "#bdd4f0" },
  storm: { bg0: "#08000f", bg1: "#160025", accent: "#a066ff" },
};

// ── Fetch ─────────────────────────────────────────────────────────────────────
// WMO weather interpretation codes → human-readable description
// (strings are chosen to match weatherCat() keyword checks)
function wmoDescription(code: number): string {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code === 95) return "Thunderstorm";
  if (code >= 96) return "Thunderstorm with hail";
  return "Cloudy";
}

type OpenMeteoResult = {
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
};

const BATCH_SIZE = 100; // keep URLs well under limits

async function fetchWeather(): Promise<WeatherData[]> {
  const cities = [...CITIES];
  const chunks: (typeof cities)[] = [];
  for (let i = 0; i < cities.length; i += BATCH_SIZE) {
    chunks.push(cities.slice(i, i + BATCH_SIZE));
  }

  const chunkResults = await Promise.all(
    chunks.map(async (chunk) => {
      const lats = chunk.map((c) => c.lat).join(",");
      const lons = chunk.map((c) => c.lon).join(",");
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lats}&longitude=${lons}` +
        `&current=temperature_2m,wind_speed_10m,weather_code` +
        `&wind_speed_unit=kmh`;
      try {
        const res = await fetch(url);
        const data = (await res.json()) as OpenMeteoResult | OpenMeteoResult[];
        const results = Array.isArray(data) ? data : [data];
        return chunk.map((city, i): WeatherData => {
          const r = results[i];
          if (!r?.current)
            return { city, temp: 0, windKph: 0, description: "" };
          return {
            city,
            temp: Math.round(r.current.temperature_2m),
            windKph: Math.round(r.current.wind_speed_10m),
            description: wmoDescription(r.current.weather_code),
          };
        });
      } catch {
        return chunk.map(
          (city): WeatherData => ({
            city,
            temp: 0,
            windKph: 0,
            description: "",
          }),
        );
      }
    }),
  );

  return chunkResults.flat();
}

// ── Canvas helpers ────────────────────────────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ── Weather effect painters ───────────────────────────────────────────────────
function drawClear(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cw: number,
  now: number,
) {
  const t = now * 0.001;
  const cx = x + cw / 2;
  const cy = y + cw * 0.38;
  const r = cw * 0.14;
  const numSpokes = 12;

  // Glow
  const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, cw * 0.55);
  glow.addColorStop(0, "rgba(245,168,48,0.18)");
  glow.addColorStop(1, "rgba(245,168,48,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, cw, cw);

  // Rotating spokes
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 0.4);
  ctx.strokeStyle = "rgba(245,168,48,0.35)";
  ctx.lineWidth = 1;
  for (let i = 0; i < numSpokes; i++) {
    const a = (i / numSpokes) * Math.PI * 2;
    const inner = r * 1.5;
    const outer = r * 2.4 + Math.sin(t * 2 + i) * r * 0.3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    ctx.stroke();
  }
  ctx.restore();

  // Sun disc
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  const disc = ctx.createRadialGradient(
    cx - r * 0.3,
    cy - r * 0.3,
    0,
    cx,
    cy,
    r,
  );
  disc.addColorStop(0, "#ffe577");
  disc.addColorStop(1, "#f5a830");
  ctx.fillStyle = disc;
  ctx.fill();
}

function drawCloudy(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cw: number,
  now: number,
) {
  const t = now * 0.0005;
  // Two slowly drifting cloud blobs
  const clouds = [
    { ox: 0.2, oy: 0.32, rx: 0.22, ry: 0.1, speed: 0.12, alpha: 0.28 },
    { ox: 0.5, oy: 0.45, rx: 0.3, ry: 0.12, speed: 0.08, alpha: 0.22 },
  ];
  ctx.save();
  ctx.fillStyle = "rgba(120,150,190,0.18)";
  for (const c of clouds) {
    const bx = x + (((c.ox + t * c.speed) % 1.4) - 0.2) * cw;
    const by = y + c.oy * cw;
    ctx.globalAlpha = c.alpha;
    ctx.beginPath();
    ctx.ellipse(bx, by, c.rx * cw, c.ry * cw, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawFog(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cw: number,
  now: number,
) {
  const t = now * 0.0003;
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const oy = y + (0.25 + i * 0.15) * cw;
    const shift = ((t * (0.06 + i * 0.02) + i * 0.4) % 1.6) - 0.3;
    const bx = x + shift * cw;
    ctx.globalAlpha = 0.12 - i * 0.02;
    ctx.fillStyle = "#9ea8b4";
    ctx.beginPath();
    ctx.ellipse(bx + cw * 0.5, oy, cw * 0.6, cw * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawRain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cw: number,
  now: number,
) {
  const t = now * 0.001;
  const n = 28;
  const spd = 180; // px/s equivalent via t

  ctx.save();
  ctx.strokeStyle = "rgba(77,150,217,0.55)";
  ctx.lineWidth = 1;

  for (let i = 0; i < n; i++) {
    const fx = x + ((i * 37 + 11) % (cw + 10));
    const fy = ((t * spd + i * (cw / n) * 1.5) % (cw + 20)) - 10;
    const len = 7 + (i % 4) * 3;
    ctx.globalAlpha = 0.3 + (i % 3) * 0.15;
    ctx.beginPath();
    ctx.moveTo(fx - 1, y + fy);
    ctx.lineTo(fx - 3, y + fy + len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawSnow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cw: number,
  now: number,
) {
  const t = now * 0.001;
  const n = 22;
  const spd = 40;

  ctx.save();
  ctx.fillStyle = "rgba(180,210,240,0.7)";

  for (let i = 0; i < n; i++) {
    const fx = x + ((i * 43 + 7) % cw) + Math.sin(t * 0.8 + i * 1.3) * 6;
    const fy = ((t * spd + i * (cw / n) * 1.7) % (cw + 10)) - 5;
    const r = 1.5 + (i % 3) * 0.8;
    ctx.globalAlpha = 0.4 + (i % 4) * 0.1;
    ctx.beginPath();
    ctx.arc(fx, y + fy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawStorm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cw: number,
  now: number,
) {
  // Rain
  drawRain(ctx, x, y, cw, now);

  // Occasional lightning flash
  const t = now * 0.001;
  const cycle = 4.0; // seconds per cycle
  const phase = t % cycle;
  if (phase < 0.08) {
    ctx.save();
    ctx.fillStyle = `rgba(180,120,255,${0.25 * (1 - phase / 0.08)})`;
    ctx.fillRect(x, y, cw, cw);
    ctx.restore();
  }

  // Lightning bolt
  const boltPhase = (t * 0.5) % 5;
  if (boltPhase < 0.12) {
    const bx = x + cw * 0.52;
    const by = y + cw * 0.1;
    ctx.save();
    ctx.strokeStyle = `rgba(200,160,255,${0.8 * (1 - boltPhase / 0.12)})`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "#a066ff";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - cw * 0.06, by + cw * 0.22);
    ctx.lineTo(bx + cw * 0.04, by + cw * 0.22);
    ctx.lineTo(bx - cw * 0.08, by + cw * 0.45);
    ctx.stroke();
    ctx.restore();
  }
}

function drawWeatherEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cw: number,
  cat: WeatherCat,
  now: number,
) {
  switch (cat) {
    case "clear":
      return drawClear(ctx, x, y, cw, now);
    case "cloudy":
      return drawCloudy(ctx, x, y, cw, now);
    case "fog":
      return drawFog(ctx, x, y, cw, now);
    case "rain":
      return drawRain(ctx, x, y, cw, now);
    case "snow":
      return drawSnow(ctx, x, y, cw, now);
    case "storm":
      return drawStorm(ctx, x, y, cw, now);
  }
}

// ── Cell draw ─────────────────────────────────────────────────────────────────
function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cw: number,
  w: WeatherData,
  hover: boolean,
  now: number,
  useFahrenheit: boolean,
) {
  const cat = weatherCat(w.description);
  const palette = PALETTES[cat];
  const big = cw >= 160;

  ctx.save();
  roundRect(ctx, x, y, cw, cw, RADIUS);
  ctx.clip();

  // Background
  const bg = ctx.createLinearGradient(x, y, x + cw, y + cw);
  bg.addColorStop(0, palette.bg0);
  bg.addColorStop(1, palette.bg1);
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, cw, cw);

  // Animated weather effect
  drawWeatherEffect(ctx, x, y, cw, cat, now);

  // Hover overlay
  if (hover) {
    ctx.fillStyle = "rgba(0,0,0,0.60)";
    ctx.fillRect(x, y, cw, cw);
  }

  const displayTemp = useFahrenheit
    ? Math.round((w.temp * 9) / 5 + 32)
    : w.temp;
  const unit = useFahrenheit ? "°F" : "°C";

  if (hover) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = `bold ${big ? 28 : 19}px monospace`;
    ctx.fillStyle = palette.accent;
    ctx.fillText(`${displayTemp}${unit}`, x + cw / 2, y + cw * 0.28);

    ctx.font = `600 ${big ? 11 : 8}px monospace`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(w.city.name, x + cw / 2, y + cw * 0.46);

    ctx.font = `400 ${big ? 9 : 7}px monospace`;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(w.description, x + cw / 2, y + cw * 0.57);

    if (big) {
      ctx.font = "400 8px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.38)";
      ctx.fillText(`Wind ${w.windKph} km/h`, x + cw / 2, y + cw * 0.7);
    }
  } else {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = `bold ${big ? 32 : 22}px monospace`;
    ctx.fillStyle = palette.accent;
    ctx.shadowColor = palette.accent;
    ctx.shadowBlur = 8;
    ctx.fillText(`${displayTemp}°`, x + cw / 2, y + cw * 0.37);
    ctx.shadowBlur = 0;

    ctx.font = `600 ${big ? 11 : 8}px monospace`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(w.city.name, x + cw / 2, y + cw * 0.56);

    ctx.font = `400 ${big ? 10 : 7}px monospace`;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(
      `${w.city.country} ${weatherEmoji(w.description)}`,
      x + cw / 2,
      y + cw * 0.7,
    );
  }

  ctx.restore();

  // Border
  roundRect(ctx, x, y, cw, cw, RADIUS);
  ctx.strokeStyle = hover ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ── Component ─────────────────────────────────────────────────────────────────
export function GodlyWeather() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0, moved: false });
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const dataRef = useRef<WeatherData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cursor, setCursor] = useState<"grab" | "grabbing">("grab");
  const [fahrenheit, setFahrenheit] = useState(false);
  const fahrenheitRef = useRef(false);
  const filteredRef = useRef<WeatherData[]>([]);
  const [activeContinent, setActiveContinent] = useState<string | null>(null);

  // Keep ref in sync with state so the draw loop can read it
  useEffect(() => {
    fahrenheitRef.current = fahrenheit;
  }, [fahrenheit]);

  useEffect(() => {
    fetchWeather().then((data) => {
      dataRef.current = data;
      filteredRef.current = data;
      setLoaded(true);
    });
  }, []);

  const selectContinent = (id: string | null) => {
    const next = activeContinent === id ? null : id;
    filteredRef.current = next
      ? dataRef.current.filter((d) => d.city.continent === next)
      : dataRef.current;
    camRef.current = { x: 0, y: 0 };
    velRef.current = { x: 0, y: 0 };
    setActiveContinent(next);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (now: number) => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      if (!dragRef.current.active) {
        velRef.current.x *= FRICTION;
        velRef.current.y *= FRICTION;
        camRef.current.x += velRef.current.x;
        camRef.current.y += velRef.current.y;
      }

      const data = filteredRef.current;
      const N = data.length;

      if (N === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.font = "400 12px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("fetching weather…", W / 2, H / 2);
        rafRef.current = requestAnimationFrame(draw as FrameRequestCallback);
        return;
      }

      const cw = cellSize();
      const stride = cw + GAP;
      const cam = camRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      const col0 = Math.floor(cam.x / stride) - 1;
      const col1 = Math.ceil((cam.x + W) / stride) + 1;
      const row0 = Math.floor(cam.y / stride) - 1;
      const row1 = Math.ceil((cam.y + H) / stride) + 1;

      for (let row = row0; row <= row1; row++) {
        for (let col = col0; col <= col1; col++) {
          const sx = col * stride - cam.x;
          const sy = row * stride - cam.y;
          const idx = (((col * 7 + row * 13) % N) + N) % N;
          const w = data[idx];
          const hover = mx >= sx && mx <= sx + cw && my >= sy && my <= sy + cw;
          drawCell(ctx, sx, sy, cw, w, hover, now, fahrenheitRef.current);
        }
      }

      rafRef.current = requestAnimationFrame(draw as FrameRequestCallback);
    };
    rafRef.current = requestAnimationFrame(draw as FrameRequestCallback);

    const onDown = (e: PointerEvent) => {
      dragRef.current = {
        active: true,
        lastX: e.clientX,
        lastY: e.clientY,
        moved: false,
      };
      velRef.current = { x: 0, y: 0 };
      setCursor("grabbing");
    };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
      camRef.current.x -= dx;
      camRef.current.y -= dy;
      velRef.current.x = velRef.current.x * 0.6 + -dx * 0.4;
      velRef.current.y = velRef.current.y * 0.6 + -dy * 0.4;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (e.target !== canvas) {
        dragRef.current.active = false;
        setCursor("grab");
        return;
      }
      const wasDrag = dragRef.current.moved;
      dragRef.current.active = false;
      setCursor("grab");

      if (!wasDrag) {
        // Click = toggle °C/°F
        setFahrenheit((f) => !f);
      }
    };
    const onLeave = () => {
      dragRef.current.active = false;
      mouseRef.current = { x: -9999, y: -9999 };
      setCursor("grab");
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      velRef.current.x += e.deltaX * 0.25;
      velRef.current.y += e.deltaY * 0.25;
    };

    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  return (
    <div
      className="relative w-full h-full"
      style={{ backgroundColor: "#080808" }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block select-none"
        style={{ cursor, touchAction: "none" }}
      />

      {/* ── HUD ────────────────────────────────────────────────────────────── */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          backgroundColor: "rgba(8,8,8,0.88)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          padding: "6px 10px",
        }}
      >
        {/* Continent tags */}
        {CONTINENT_TAGS.map((tag) => {
          const active = activeContinent === tag.id;
          return (
            <button
              key={tag.id}
              onClick={() => selectContinent(tag.id)}
              className="font-mono text-[9px] uppercase tracking-[0.18em] px-2 py-1"
              style={{
                color: active ? "#00e5ff" : "rgba(255,255,255,0.35)",
                border: `1px solid ${active ? "#00e5ff" : "transparent"}`,
                cursor: "pointer",
                background: "transparent",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {active && <span style={{ fontSize: 7, marginRight: 3 }}>▶</span>}
              {tag.label}
            </button>
          );
        })}

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 14,
            background: "rgba(255,255,255,0.1)",
            margin: "0 2px",
          }}
        />

        {/* °C / °F toggle */}
        <button
          onClick={() => setFahrenheit((f) => !f)}
          className="font-mono text-[9px] uppercase tracking-[0.18em] px-2 py-1"
          style={{
            color: "rgba(255,255,255,0.35)",
            cursor: "pointer",
            background: "transparent",
            border: "1px solid transparent",
          }}
        >
          {fahrenheit ? "°F" : "°C"}
        </button>
      </div>
    </div>
  );
}
