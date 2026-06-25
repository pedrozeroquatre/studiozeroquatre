'use client'

import Image from 'next/image'
import { useState, useMemo } from 'react'
import doggybag2 from '@/assets/doggy_bag_2.jpeg'
import doggybag1 from '@/assets/doggybag_1.jpeg'
import pizzaBox from '@/assets/blank_pizza_box.jpeg'
import burgerBox from '@/assets/burger_box.jpeg'
import product1 from '@/assets/products/product_1.jpeg'
import product2 from '@/assets/products/product_2.jpeg'
import product3 from '@/assets/products/product_3.jpeg'
import product4 from '@/assets/products/product_4.jpeg'
import product5 from '@/assets/products/product_5.jpeg'
import product6 from '@/assets/products/product_6.jpeg'
import product7 from '@/assets/products/product_7.jpeg'
import product8 from '@/assets/products/product_8.jpeg'
import product9 from '@/assets/products/product_9.jpeg'
import product10 from '@/assets/products/product_10.jpeg'
import product11 from '@/assets/products/product_11.jpeg'
import product12 from '@/assets/products/product_12.jpeg'
import product13 from '@/assets/products/product_13.jpeg'
import product14 from '@/assets/products/product_14.jpeg'
import product15 from '@/assets/products/product_15.jpeg'
import product16 from '@/assets/products/product_16.jpeg'
import product17 from '@/assets/products/product_17.jpeg'
import product18 from '@/assets/products/product_18.jpeg'
import product19 from '@/assets/products/product_19.jpeg'
import product20 from '@/assets/products/product_20.jpeg'
import product21 from '@/assets/products/product_21.jpeg'
import product22 from '@/assets/products/product_22.jpeg'
import product23 from '@/assets/products/product_23.jpeg'
import product24 from '@/assets/products/product_24.jpeg'
import product25 from '@/assets/products/product_25.jpeg'
import product26 from '@/assets/products/product_26.jpeg'
import product27 from '@/assets/products/product_27.jpeg'
import product28 from '@/assets/products/product_28.jpeg'
import product29 from '@/assets/products/product_29.jpeg'
import product30 from '@/assets/products/product_30.jpeg'
import product31 from '@/assets/products/product_31.jpeg'
import product32 from '@/assets/products/product_32.jpeg'
import product33 from '@/assets/products/product_33.jpeg'
import product34 from '@/assets/products/product_34.jpeg'
import product35 from '@/assets/products/product_35.jpeg'
import product36 from '@/assets/products/product_36.jpeg'
import product37 from '@/assets/products/product_37.jpeg'
import product38 from '@/assets/products/product_38.jpeg'
import product39 from '@/assets/products/product_39.jpeg'
import product40 from '@/assets/products/product_40.jpeg'
import product41 from '@/assets/products/product_41.jpeg'
import product42 from '@/assets/products/product_42.jpeg'
import product43 from '@/assets/products/product_43.jpeg'
import product44 from '@/assets/products/product_44.jpeg'
import product45 from '@/assets/products/product_45.jpeg'
import product46 from '@/assets/products/product_46.jpeg'
import product47 from '@/assets/products/product_47.jpeg'
import product48 from '@/assets/products/product_48.jpeg'
import product49 from '@/assets/products/product_49.jpeg'
import product50 from '@/assets/products/product_50.jpeg'
import product51 from '@/assets/products/product_51.jpeg'
import product52 from '@/assets/products/product_52.jpeg'

const BEST_SELLERS = [
  {
    id: 'boite-pizza',
    image: pizzaBox,
    alt: 'Boîte pizza blanche',
    name: 'Boîte pizza',
    description: 'Boîte pizza en carton ondulé blanc, solide et isolante.',
    dimensions: ['28 × 28 × 4 cm', '33 × 33 × 4 cm', '38 × 38 × 4 cm'],
  },
  {
    id: 'boite-burger',
    image: burgerBox,
    alt: 'Boîte burger blanche',
    name: 'Boîte burger',
    description: 'Boîte burger compacte en carton rigide, maintien optimal.',
    dimensions: ['10 × 10 × 8 cm', '12 × 12 × 10 cm', '15 × 15 × 12 cm'],
  },
  {
    id: 'sac-poignees',
    image: doggybag2,
    alt: 'Sac kraft à poignées torsadées',
    name: 'Sac à poignées',
    description: 'Sac kraft blanc à poignées torsadées, idéal pour le take-away.',
    dimensions: ['S — 22 × 12 × 22 cm', 'M — 28 × 16 × 28 cm', 'L — 35 × 20 × 32 cm'],
  },
  {
    id: 'sac-kraft',
    image: doggybag1,
    alt: 'Sac kraft simple sans poignées',
    name: 'Sac kraft simple',
    description: 'Sac papier sans poignées, classique et fonctionnel.',
    dimensions: ['S — 14 × 8 × 26 cm', 'M — 18 × 10 × 30 cm', 'L — 24 × 12 × 38 cm'],
  },
]

const CATALOGUE = [
  { id: 'sachet-doypack', category: 'Sacs', image: product1, name: 'Sachet Doypack kraft + fenêtre', description: 'Sachet doypack kraft avec fenêtre transparente et fermeture pression refermable.', dimensions: ['80 × 140 + 25+25 mm', '110 × 190 + 35+35 mm', '130 × 220 + 35+35 mm', '160 × 270 + 35+35 mm'] },
  { id: 'sachet-doypack-cafe', category: 'Sacs', image: product2, name: 'Sachet Doypack kraft café + valve', description: 'Sachet doypack kraft avec valve de dégazage et fermeture pression refermable.', dimensions: ['110 × 190 + 35+35 mm', '130 × 220 + 35+35 mm', '160 × 270 + 35+35 mm'] },
  { id: 'sachet-fond-plat-cafe', category: 'Sacs', image: product3, name: 'Sachet fond plat kraft café + valve', description: 'Sachet en kraft à fond plat avec valve de dégazage, pour le café.', dimensions: ['100+60 × 200 mm', '120+60 × 220 mm', '140+70 × 250 mm', '160+80 × 260 mm', '180+80 × 280 mm'] },
  { id: 'sachet-doypack-transparent', category: 'Sacs', image: product4, name: 'Sachet Doypack transparent PET/PE', description: 'Sachet doypack entièrement transparent PET/PE, fermeture pression refermable.', dimensions: ['85 × 145 + 30+30 mm', '110 × 185 + 35+35 mm', '130 × 225 + 35+35 mm', '160 × 270 + 40+40 mm', '180 × 290 + 45+45 mm', '200 × 300 + 50+50 mm'] },
  { id: 'sachet-bopp-souple', category: 'Sacs', image: product5, name: 'Sachet BOPP fond carré thermosoudable', description: 'Sachet transparent BOPP à fond carré souple, thermosoudable.', dimensions: ['60+40 × 200 mm', '80+50 × 240 mm', '100+50 × 300 mm', '120+60 × 320 mm', '140+80 × 340 mm', '160+90 × 360 mm'] },
  { id: 'sachet-bopp-rigide', category: 'Sacs', image: product6, name: 'Sachet BOPP fond carré rigide', description: 'Sachet transparent BOPP à fond carré rigide en carton.', dimensions: ['80+50 × 240 mm', '100+50 × 300 mm', '120+60 × 320 mm', '140+80 × 340 mm'] },
  { id: 'sachet-kraft-fond-carre', category: 'Sacs', image: product7, name: 'Sachet kraft fond carré + fenêtre', description: 'Sachet kraft à fond carré avec fenêtre transparente en PP.', dimensions: ['80+50 × 280 mm', '100+60 × 300 mm', '110+60 × 340 mm', '120+70 × 370 mm', '160+90 × 360 mm'] },
  { id: 'sachet-polyethylene', category: 'Sacs', image: product8, name: 'Sachet polyéthylène transparent', description: 'Sachet polyéthylène transparent lisse, 30 microns.', dimensions: ['20 × 40 cm', '25 × 35 cm', '28 × 40 cm', '32 × 45 cm', '40 × 50 cm'] },
  { id: 'papier-alimentaire', category: 'Accessoires', image: product9, name: 'Papier alimentaire décoré', description: 'Papier alimentaire en cellulose avec motifs décoratifs.', dimensions: ['37 × 50 cm', '50 × 70 cm', '75 × 100 cm'] },
  { id: 'sachet-papier-polyenrobe', category: 'Sacs', image: product10, name: 'Sachet papier polyenrobé', description: 'Sachet en papier polyenrobé résistant au gras, pour boulangerie et pâtisserie.', dimensions: ['12+8 × 26 cm', '14+10 × 30 cm', '17+11 × 34 cm'] },
  { id: 'shopper-kraft-torsadees', category: 'Sacs', image: product11, name: 'Shopper kraft poignées torsadées', description: 'Sac shopper kraft naturel à poignées torsadées, résistant pour le commerce et le traiteur.', dimensions: ['16+8 × 23 cm', '21+9 × 25 cm', '22+10 × 29.5 cm', '26+14 × 40 cm', '26+17 × 27 cm', '28+20 × 31 cm', '32+16 × 45 cm', '32+20 × 31 cm'] },
  { id: 'shopper-blanc-torsadees', category: 'Sacs', image: product12, name: 'Shopper blanc poignées torsadées', description: 'Sac shopper blanc à poignées torsadées, idéal pour la vente au détail.', dimensions: ['22+10 × 29.5 cm', '26+14 × 40 cm', '26+17 × 27 cm', '28+20 × 31 cm', '32+20 × 31 cm'] },
  { id: 'sac-bouteille-kraft', category: 'Sacs', image: product13, name: 'Sac bouteille kraft', description: 'Sac porte-bouteille en kraft naturel avec soufflets latéraux.', dimensions: ['12+9 × 36 cm', '12+9 × 40 cm'] },
  { id: 'shopper-kraft-plates', category: 'Sacs', image: product14, name: 'Shopper kraft poignées plates', description: 'Sac shopper kraft à poignées plates, format portrait.', dimensions: ['18+8 × 22 cm', '22+10 × 30 cm', '26+14 × 40 cm', '32+16 × 45 cm', '46+16 × 49 cm'] },
  { id: 'shopper-blanc-plates', category: 'Sacs', image: product15, name: 'Shopper blanc poignées plates', description: 'Sac shopper blanc à poignées plates, format portrait.', dimensions: ['22+10 × 30 cm', '26+14 × 40 cm', '26+17 × 27 cm', '28+20 × 29 cm', '32+16 × 45 cm', '32+20 × 30 cm', '46+16 × 49 cm'] },
  { id: 'shopper-rouge-plates', category: 'Sacs', image: product16, name: 'Shopper rouge poignées plates', description: 'Sac shopper rouge à poignées plates, format portrait.', dimensions: ['22+10 × 30 cm', '26+14 × 40 cm', '32+16 × 45 cm', '46+16 × 49 cm'] },
  { id: 'shopper-orange-plates', category: 'Sacs', image: product17, name: 'Shopper orange poignées plates', description: 'Sac shopper orange à poignées plates, format portrait.', dimensions: ['22+10 × 30 cm', '26+14 × 40 cm', '32+16 × 45 cm', '46+16 × 49 cm'] },
  { id: 'shopper-kraft-paysage', category: 'Sacs', image: product18, name: 'Shopper kraft format paysage', description: 'Sac shopper kraft à poignées plates, grand format paysage.', dimensions: ['18+8 × 22 cm', '22+10 × 30 cm', '26+14 × 40 cm', '26+17 × 27 cm', '28+20 × 29 cm', '32+16 × 45 cm', '32+20 × 30 cm', '46+16 × 49 cm'] },
  { id: 'shopper-noir-paysage', category: 'Sacs', image: product19, name: 'Shopper noir format paysage', description: 'Sac shopper noir à poignées plates, grand format paysage.', dimensions: ['18+8 × 22 cm', '22+10 × 30 cm', '26+14 × 40 cm', '26+17 × 27 cm', '28+20 × 29 cm', '32+16 × 45 cm', '32+20 × 30 cm', '46+16 × 49 cm'] },
  { id: 'shopper-blanc-paysage', category: 'Sacs', image: product20, name: 'Shopper blanc format paysage', description: 'Sac shopper blanc à poignées plates, grand format paysage.', dimensions: ['18+8 × 22 cm', '22+10 × 30 cm', '26+14 × 40 cm', '26+17 × 27 cm', '28+20 × 29 cm', '32+16 × 45 cm', '32+20 × 30 cm', '46+16 × 49 cm'] },
  { id: 'shopper-kraft-grand-torsadees', category: 'Sacs', image: product21, name: 'Shopper kraft grand format poignées torsadées', description: 'Sac shopper kraft grand format à poignées torsadées, pour grandes commandes.', dimensions: ['16+7 × 39 cm', '18+7 × 24 cm', '24+10 × 31 cm', '27+11 × 36 cm', '32+12 × 36 cm', '32+12 × 41 cm', '32+12 × 46 cm', '40+12 × 41 cm', '46+16 × 49 cm', '54+15 × 49 cm'] },
  { id: 'shopper-noir-grand-torsadees', category: 'Sacs', image: product22, name: 'Shopper noir grand format poignées torsadées', description: 'Sac shopper noir grand format à poignées torsadées.', dimensions: ['16+7 × 39 cm', '18+7 × 24 cm', '24+10 × 31 cm', '27+11 × 36 cm', '32+12 × 36 cm', '32+12 × 41 cm', '32+12 × 46 cm', '40+12 × 41 cm', '46+16 × 49 cm', '54+15 × 49 cm'] },
  { id: 'shopper-blanc-grand-torsadees', category: 'Sacs', image: product23, name: 'Shopper blanc grand format poignées torsadées', description: 'Sac shopper blanc grand format à poignées torsadées.', dimensions: ['16+7 × 39 cm', '18+7 × 24 cm', '24+10 × 31 cm', '27+11 × 36 cm', '32+12 × 36 cm', '32+12 × 41 cm', '32+12 × 46 cm', '40+12 × 41 cm', '46+16 × 49 cm', '54+15 × 49 cm'] },
  { id: 'shopper-kraft-large', category: 'Sacs', image: product24, name: 'Shopper kraft large doubles poignées', description: 'Sac shopper kraft large à doubles poignées plates.', dimensions: ['26+16 × 30 cm', '28+20 × 29 cm', '32+16 × 30 cm', '32+20 × 30 cm'] },
  { id: 'shopper-noir-large', category: 'Sacs', image: product25, name: 'Shopper noir large doubles poignées', description: 'Sac shopper noir large à doubles poignées plates.', dimensions: ['26+16 × 30 cm', '28+20 × 29 cm', '32+16 × 30 cm', '32+20 × 30 cm'] },
  { id: 'shopper-blanc-large', category: 'Sacs', image: product26, name: 'Shopper blanc large doubles poignées', description: 'Sac shopper blanc large à doubles poignées plates.', dimensions: ['26+16 × 30 cm', '28+20 × 29 cm', '32+16 × 30 cm', '32+20 × 30 cm'] },
  { id: 'boite-patissiere-carree', category: 'Boîtes', image: product27, name: 'Boîte pâtissière carrée avec anse', description: 'Boîte pâtissière carrée en carton kraft avec anse intégrée.', dimensions: ['17 × 17 h7 cm', '19 × 19 h7 cm', '21 × 21 h7 cm', '23 × 23 h7 cm', '25 × 25 h7 cm', '27 × 27 h7 cm', '29 × 29 h7 cm', '31 × 31 h7 cm', '33 × 33 h7 cm', '36 × 36 h7 cm', '39 × 39 h7 cm', '41 × 41 h7 cm', '43 × 43 h7 cm', '45 × 45 h7 cm', '50 × 50 h7 cm'] },
  { id: 'boite-patissiere-rect', category: 'Boîtes', image: product28, name: 'Boîte pâtissière rectangulaire avec anse', description: 'Boîte pâtissière rectangulaire en carton kraft avec anse intégrée.', dimensions: ['15 × 27 h7 cm', '15 × 32 h7 cm', '15 × 36 h7 cm', '17 × 41 h7 cm', '18 × 31 h7 cm', '18 × 38 h7 cm', '31 × 42 h10 cm', '40 × 50 h10 cm', '45 × 55 h10 cm', '48 × 68 h10 cm'] },
  { id: 'boite-patissiere-basse', category: 'Boîtes', image: product29, name: 'Boîte pâtissière basse avec anse', description: 'Boîte à pâtisseries basse en carton kraft avec anse intégrée.', dimensions: ['13 × 19 h6.5 cm', '15.5 × 22.5 h6.5 cm', '17 × 23 h6.5 cm', '20 × 25 h6.5 cm', '21 × 29 h6.5 cm', '24 × 32 h6.5 cm', '26 × 35 h6.5 cm', '28 × 39 h6.5 cm', '33 × 54 h6.5 cm'] },
  { id: 'boite-kraft-couvercle-plat', category: 'Boîtes', image: product30, name: 'Boîte kraft à couvercle plat', description: 'Boîte kraft à couvercle plat pour gâteaux et tartes.', dimensions: ['13.5 × 19 h6.5 cm', '15.5 × 22.5 h6.5 cm', '18 × 25 h6.5 cm', '19.5 × 27.5 h6.5 cm', '21 × 30 h6.5 cm', '24 × 32 h6.5 cm', '26 × 34 h6.5 cm', '28 × 38 h6.5 cm', '31 × 42 h6.5 cm'] },
  { id: 'boite-kraft-fenetre-ronde', category: 'Boîtes', image: product31, name: 'Boîte kraft couvercle fenêtre ronde', description: 'Boîte kraft à couvercle plat avec fenêtre ronde transparente.', dimensions: ['21 × 21 h4 cm', '25 × 25 h4 cm'] },
  { id: 'boite-monoportion-classique', category: 'Boîtes', image: product32, name: 'Boîte monoporzione classique', description: 'Boîte monoporzione en kraft avec anse arrondie intégrée.', dimensions: ['10 × 10 h8 cm', '13 × 13 h10 cm'] },
  { id: 'boite-monoportion-dama', category: 'Boîtes', image: product33, name: 'Boîte monoporzione Dama', description: 'Boîte monoporzione Dama en kraft pour portions individuelles.', dimensions: ['13 × 13 h10 cm', '15 × 15 h10 cm'] },
  { id: 'boite-patissiere-rayee', category: 'Boîtes', image: product34, name: 'Boîte pâtissière rayée gessato', description: 'Boîte pâtissière à motif rayé gessato avec couvercle rigide.', dimensions: ['17 × 17 h10 cm', '23 × 23 h15 cm', '25 × 25 h15 cm', '27 × 27 h15 cm', '30 × 30 h15 cm', '33 × 33 h15 cm'] },
  { id: 'boite-blanche-fenetre', category: 'Boîtes', image: product35, name: 'Boîte pâtissière blanche + fenêtre', description: 'Boîte pâtissière blanche à couvercle avec fenêtre transparente.', dimensions: ['18 × 9 h10 cm', '17 × 17 h10 cm', '27 × 27 h10 cm'] },
  { id: 'boite-panettone-anse', category: 'Boîtes', image: product36, name: 'Boîte panettone kraft avec anse', description: 'Boîte en kraft pour panettone et pandoro avec anse intégrée.', dimensions: ['20 × 20 × 12 cm', '22 × 22 × 14 cm', '24 × 24 × 16 cm', '16 × 16 × 18 cm', '18 × 18 × 20 cm', '20 × 20 × 22 cm'] },
  { id: 'cappelliera-panettone', category: 'Boîtes', image: product37, name: 'Cappelliera panettone avec cordons', description: 'Boîte cappelliera kraft pour panettone, livrée avec cordons décoratifs.', dimensions: ['26 × 26 × 18 cm'] },
  { id: 'barquette-ca-pet', category: 'Barquettes', image: product38, name: 'Barquette papier+PET recyclable', description: 'Barquette Ca+PET recyclable, compatible micro-ondes et four 200°C.', dimensions: ['140 × 125 h45 mm', '194 × 137 h45 mm', '232 × 192 h45 mm', '262 × 192 h45 mm', '310 × 210 h40 mm', '175 × 175 h35 mm'] },
  { id: 'vassoio-kraft-my-trays', category: 'Barquettes', image: product39, name: 'Vassoio kraft Ca+PE My Trays', description: 'Vassoio kraft Ca+PE thermosoudable pour traiteur et restauration.', dimensions: ['170 × 122 h16 mm', '170 × 148 h24 mm', '203 × 163 h22 mm', '205 × 141 h24 mm', '209 × 139 h43 mm', '248 × 174 h22 mm'] },
  { id: 'forme-cotture-tortina', category: 'Accessoires', image: product40, name: 'Forme cotture tortina ronde', description: 'Forme de cuisson ronde en carton kraft pour tortines et tartelettes.', dimensions: ['Ø120 h30 mm', 'Ø170 h35 mm', 'Ø185 h35 mm', 'Ø210 h25 mm'] },
  { id: 'stampo-tarte-ondule', category: 'Accessoires', image: product41, name: 'Stampo ondulé pour tarte', description: 'Stampo en carton marron ondulé pour tartes et flans.', dimensions: ['Ø135/146/158 h20 mm', 'Ø185/200/214 h20 mm', 'Ø220/232/247 h25 mm', 'Ø248/260/278 h25 mm'] },
  { id: 'moule-plumcake', category: 'Accessoires', image: product42, name: 'Moule papier plumcake', description: 'Moule papier pour plumcake, résistant à la cuisson au four.', dimensions: ['150 × 65 h50 mm', '200 × 65 h45 mm', '225 × 70 h65 mm'] },
  { id: 'forme-panettone-kraft', category: 'Accessoires', image: product43, name: 'Forme papier panettone', description: 'Forme de cuisson panettone en papier kraft, usage unique.', dimensions: ['Ø134 h95 mm', 'Ø154 h112 mm', 'Ø155 h110 mm', 'Ø172 h125 mm'] },
  { id: 'forme-panettone-elite', category: 'Accessoires', image: product44, name: 'Forme panettone Elite', description: 'Forme de cuisson panettone Elite en papier, finition premium.', dimensions: ['Ø134 mm (500g)', 'Ø154 mm (750g)', 'Ø168 mm (1000g)', 'Ø170 h55 mm', 'Ø200 h65 mm', 'Ø210 h70 mm'] },
  { id: 'forme-colomba', category: 'Accessoires', image: product45, name: 'Forme papier colomba', description: 'Forme de cuisson colomba en papier pour brioches de Pâques.', dimensions: ['250 × 180 h50 mm (500g)', '285 × 200 h58 mm (750g)', '320 × 225 h65 mm (1000g)'] },
  { id: 'napperon-rond-dentelle', category: 'Accessoires', image: product46, name: 'Napperon rond en dentelle', description: 'Napperon rond en dentelle blanche pour présentation pâtissière.', dimensions: ['Ø13 cm', 'Ø16 cm', 'Ø18 cm', 'Ø20 cm', 'Ø23 cm', 'Ø25 cm', 'Ø28 cm', 'Ø30 cm', 'Ø32 cm', 'Ø35 cm', 'Ø38 cm', 'Ø40 cm', 'Ø42 cm', 'Ø45 cm', 'Ø50 cm', 'Ø55 cm', 'Ø60 cm', 'Ø65 cm', 'Ø70 cm', 'Ø75 cm', 'Ø85 cm', 'Ø95 cm'] },
  { id: 'napperon-rect-dentelle', category: 'Accessoires', image: product47, name: 'Napperon rectangulaire en dentelle', description: 'Napperon rectangulaire en dentelle blanche pour plateau et vitrine.' },
  { id: 'napperon-ovale-sottofritto', category: 'Accessoires', image: product48, name: 'Napperon ovale sottofritto', description: 'Napperon sottofritto ovale en dentelle pour présentation et service.', dimensions: ['14 × 22 cm', '17 × 25 cm', '18 × 28 cm', '22 × 33 cm', '26 × 38 cm', '30 × 45 cm', '32 × 49 cm', '33 × 55 cm'] },
  { id: 'napperon-rond-sottofritto', category: 'Accessoires', image: product49, name: 'Napperon rond sottofritto', description: 'Napperon sottofritto rond en dentelle blanche.', dimensions: ['Ø16 cm', 'Ø18 cm', 'Ø21 cm', 'Ø23 cm', 'Ø25 cm', 'Ø28 cm', 'Ø30 cm', 'Ø33 cm', 'Ø36 cm', 'Ø40 cm'] },
  { id: 'bol-salade-conique', category: 'Barquettes', image: product50, name: 'Bol salade conique kraft', description: 'Bol salade conique en kraft avec couvercle PET transparent.', dimensions: ['Ø185 h72 mm'] },
  { id: 'square-bowl-kraft', category: 'Barquettes', image: product51, name: 'Square bowl kraft avana', description: 'Square bowl kraft pour salades et bowls, compatible micro-ondes.', dimensions: ['141 × 141 h42 mm', '152 × 152 h54 mm', '178 × 178 h50 mm', '178 × 178 h60 mm'] },
  { id: 'paper-bowl-serie-r', category: 'Barquettes', image: product52, name: 'Paper bowl kraft série R', description: 'Paper bowl kraft série R pour repas à emporter, avec couvercle.', dimensions: ['168 × 120 h45 mm', '168 × 120 h55 mm', '168 × 120 h65 mm', '168 × 120 h75 mm'] },
]

const CATEGORIES = ['Tout', 'Sacs', 'Boîtes', 'Barquettes', 'Accessoires']
const PER_PAGE = 8

function DimensionsToggle({ dimensions }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-[var(--border)] pt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-text3 hover:text-text2 transition-colors cursor-pointer w-full"
        aria-expanded={open}
      >
        <span>Dimensions</span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
          style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.25s ease' }}>
        <div style={{ overflow: 'hidden' }}>
          <ul className="mt-2 space-y-0.5">
            {dimensions.map((dim) => (
              <li key={dim} className="font-mono text-xs text-text2">{dim}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function BestSellerCard({ product }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] flex flex-col sm:flex-row overflow-hidden">
      <div className="relative sm:w-52 flex-shrink-0 bg-white h-52 sm:h-auto">
        <Image
          src={product.image}
          alt={product.alt}
          fill
          style={{ objectFit: 'contain', padding: '16px' }}
          sizes="(max-width: 640px) 100vw, 208px"
        />
      </div>
      <div className="flex flex-col flex-1 min-w-0 p-6">
        <div className="flex-1">
          <h3 className="font-syne font-bold text-xl mb-3">{product.name}</h3>
          <p className="font-mono text-sm text-text2 leading-relaxed">{product.description}</p>
        </div>
        <div className="mt-6">
          <DimensionsToggle dimensions={product.dimensions} />
        </div>
      </div>
    </div>
  )
}

function CatalogueCard({ product }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] flex flex-row overflow-hidden">
      <div className="w-36 flex-shrink-0 bg-white flex items-center justify-center">
        {product.image ? (
          <div className="relative w-full h-full">
            <Image
              src={product.image}
              alt={product.name}
              fill
              style={{ objectFit: 'contain', padding: '8px' }}
              sizes="144px"
            />
          </div>
        ) : (
          <div className="w-10 h-10 border border-[var(--border)]" />
        )}
      </div>
      <div className="flex flex-col flex-1 min-w-0 p-4">
        <div className="flex-1">
          <h3 className="font-syne font-semibold text-sm mb-2 leading-snug">{product.name}</h3>
          <p className="font-mono text-xs text-text2 leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.description}
          </p>
        </div>
        {product.dimensions?.length > 0 && (
          <div className="mt-4">
            <DimensionsToggle dimensions={product.dimensions} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProduitsPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Tout')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return CATALOGUE.filter((p) => {
      const matchesCat = activeCategory === 'Tout' || p.category === activeCategory
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      return matchesCat && matchesSearch
    })
  }, [search, activeCategory])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  function handleFilter(cat) {
    setActiveCategory(cat)
    setPage(1)
  }

  function handleSearch(e) {
    setSearch(e.target.value)
    setPage(1)
  }

  return (
    <div className="min-h-dvh pt-24 pb-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Best sellers */}
        <div className="mb-10">
          <p className="font-mono text-xs uppercase tracking-widest text-text3 mb-3">Nos produits</p>
          <h1 className="font-syne font-bold text-3xl md:text-4xl mb-4">Meilleures ventes</h1>
          <p className="font-mono text-sm text-text2 border-l-2 border-[var(--border2)] pl-4">
            Tous nos emballages sont personnalisables — votre identité, imprimée à chaque commande.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-24">
          {BEST_SELLERS.map((product) => (
            <BestSellerCard key={product.id} product={product} />
          ))}
        </div>

        {/* Catalogue header */}
        <div className="flex items-center gap-4 mb-8">
          <span className="flex-1 h-px bg-[var(--border2)]" />
          <p className="font-mono text-xs uppercase tracking-widest text-text3 whitespace-nowrap">Catalogue complet</p>
          <span className="flex-1 h-px bg-[var(--border2)]" />
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text3 pointer-events-none" width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Rechercher un produit…"
              className="w-full border border-[var(--border)] bg-[var(--surface)] font-mono text-sm pl-9 pr-4 py-2.5 outline-none focus:border-[var(--border2)] transition-colors placeholder:text-text3"
            />
          </div>
        </div>

        {/* Sidebar + Grid */}
        <div className="flex flex-col md:flex-row gap-8">

          {/* Filter sidebar */}
          <aside className="md:w-44 flex-shrink-0">
            <p className="font-mono text-xs uppercase tracking-widest text-text3 mb-4">Filtrer</p>
            <div className="flex flex-row flex-wrap md:flex-col gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleFilter(cat)}
                  className={`font-mono text-xs text-left px-3 py-2 border transition-colors cursor-pointer ${
                    activeCategory === cat
                      ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                      : 'border-[var(--border)] text-text2 hover:border-[var(--border2)] hover:text-text'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {visible.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {visible.map((product) => (
                  <CatalogueCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 border border-[var(--border)]">
                <p className="font-mono text-sm text-text3">Aucun produit trouvé.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="font-mono text-xs px-3 py-2 border border-[var(--border)] text-text2 hover:border-[var(--border2)] hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  ←
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`font-mono text-xs px-3 py-2 border transition-colors cursor-pointer ${
                      n === currentPage
                        ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                        : 'border-[var(--border)] text-text2 hover:border-[var(--border2)] hover:text-text'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="font-mono text-xs px-3 py-2 border border-[var(--border)] text-text2 hover:border-[var(--border2)] hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  →
                </button>
                <span className="font-mono text-xs text-text3 ml-1">
                  {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
