import React from 'react';
import { Link } from 'react-router-dom';

const categories = [
    {
    id: 1,
    title: "Kaantay",
    imageUrl: "https://i.pinimg.com/736x/a5/81/8f/a5818ffe6a4a40971d2cafded0bb4025.jpg",
    link: "Kaantay"
  },
  {
    id: 2,
    title: "Ear studs",
    imageUrl: "https://i.pinimg.com/736x/75/ce/eb/75ceeb6b88edfca18983030e9f6bb046.jpg",
      link: "Ear studs",
  },


  //   {
  //   id: 4,
  //   title: "Bookmarks",
  //   imageUrl: "https://scontent.flhe7-2.fna.fbcdn.net/v/t1.15752-9/520429125_1334742338219253_2531984894124566733_n.jpg?stp=dst-jpg_s480x480_tt6&_nc_cat=103&ccb=1-7&_nc_sid=0024fc&_nc_ohc=j7XYMWWmVY8Q7kNvwFYLOQX&_nc_oc=Adkef7qEPDIiflArvyMlAj0FTg2JoPnp6bRd6DV5GSZcJB7m97b8m8ZRWL8id8lVe1k&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.flhe7-2.fna&oh=03_Q7cD2wF-rY8Fqy79pbeR3ML53F8zqAW-4GruhgPAjdrVNB5Twg&oe=68AC16BF"
  // },
      {
    id: 3,
    title: "Hair accessories",
    imageUrl: "https://i.pinimg.com/736x/22/0f/88/220f8872a89702858835f393d3e57ae7.jpg",
      link: "Hair accessories"
  },
      {
    id: 4,
    title: "Kids accessories",
    imageUrl:"https://i.pinimg.com/736x/1c/bb/75/1cbb7519e7a0e6bb3aaa6ff90d1f64a5.jpg",
     link: "Kids accessories"
  },
        {
    id: 5,
    title: "Rings",
    imageUrl:"https://i.pinimg.com/736x/31/b4/e6/31b4e60278a74ff153355d03c2adb079.jpg",
     link: "Rings"
  },
  {
      id: 6,
    title: "Bangles",
    imageUrl:"https://i.pinimg.com/736x/c1/3a/0f/c13a0f160a589240038f9419e3167f3e.jpg",
     link: "Bangles"
  },
    {
      id: 7,
    title: "Bracelets",
    imageUrl:"https://i.pinimg.com/736x/13/fe/02/13fe026574d9fc451645eb06013c1a53.jpg",
     link: "Bracelets"
  },
      {
      id: 7,
    title: "Pendants",
    imageUrl:"https://i.pinimg.com/736x/9f/d5/61/9fd5614d7c7a18266c7a80f57657716f.jpg",
     link: "Pendants"
  },
      {
      id: 7,
    title: "Anklets",
    imageUrl:"https://i.pinimg.com/736x/67/a7/ee/67a7ee49cdfdccb1612a114b30b8f051.jpg",
     link: "Anklets"
  },
        {
      id: 7,
    title: "Nose pins",
    imageUrl:"https://i.pinimg.com/736x/37/9a/e8/379ae8e9431c54fb34e9638a02e207ba.jpg",
     link: "Nose pins"
  },
          {
      id: 7,
    title: "Jewelry sets",
    imageUrl:"https://i.pinimg.com/736x/7d/a4/8c/7da48ca611a797be38fd07d66c2f34e5.jpg",
     link: "Jewelry sets"
  },
          {
      id: 7,
    title: "Cosmetics",
    imageUrl:"https://i.pinimg.com/736x/63/f4/f7/63f4f7da9178eb2d6dfe48e00f0bc06f.jpg",
     link: "Cosmetics"
  },
          {
      id: 7,
    title: "Hijab accessories",
    imageUrl:"https://i.pinimg.com/1200x/34/eb/68/34eb68d145d790197208134eb8243c1f.jpg",
     link: "Hijab accessories"
  },
          {
      id: 7,
    title: "Mehndi",
    imageUrl:"https://i.pinimg.com/1200x/02/52/29/0252292301c34aadae53a642eb8f5c93.jpg",
     link: "Mehndi"
  },
          {
      id: 7,
    title: "Mystery boxes",
    imageUrl:"https://i.pinimg.com/1200x/2b/23/ff/2b23ff8b786a868218638f833ccc20b7.jpg",
     link: "Mystery boxes"
  },
            {
      id: 7,
    title: "Deal boxes",
    imageUrl:"https://i.pinimg.com/736x/ca/1f/00/ca1f00b0f706aecd38625bb070954113.jpg",
     link: "Deal boxes"
  },
              {
      id: 7,
    title: "Minor fault",
    imageUrl:"https://i.pinimg.com/736x/35/21/39/35213912398af2f7b18dc05eeb1a0634.jpg",
     link: "Minor fault"
  },
              {
      id: 7,
    title: "Miscellaneous",
    imageUrl:"https://i.pinimg.com/736x/25/25/50/2525502c62fe0624487ed125ba2f9e14.jpg",
     link: "Miscellaneous"
  },

  //       {
  //   id: 6,
  //   title: "Bag charms",
  //   imageUrl: "https://scontent.flhe3-2.fna.fbcdn.net/v/t1.15752-9/520244288_1267810474939004_9048492148598199566_n.png?stp=dst-png_s640x640&_nc_cat=106&ccb=1-7&_nc_sid=0024fc&_nc_ohc=neIk5TZGFm4Q7kNvwEuXfQ_&_nc_oc=AdmxJ4KDwZ-uqPdqouvocGIJ_PMCJuOMaF7ERpOXqSlLAudbRPv9J7oqkY8r3siKLZI&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.flhe3-2.fna&oh=03_Q7cD2wFMPcWh2mt2rXhc_FNIMeleWIzjCbZQawAV-wDep1F7MQ&oe=68A70F62"
  // },

];

function FeaturedCategories() {
  return (
<div>
  <h2 className="text-[#FFFFFF] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
    Featured Categories
  </h2>

  <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3">
    {categories.map(category => (
      <Link
        to={`/products?category=${encodeURIComponent(category.link)}`}
        key={category.id}
        className="flex flex-col gap-2 group bg-white rounded-lg overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-[1.03]"
      >
        <div
          className="w-full aspect-[1/1] bg-center bg-no-repeat bg-cover"
          style={{ backgroundImage: `url(${category.imageUrl})` }}
        ></div>
        <p className="text-[#141414] text-base font-medium leading-normal text-center px-2 pb-3">
          {category.title}
        </p>
      </Link>
    ))}
  </div>
</div>

  );
}

export default FeaturedCategories;
