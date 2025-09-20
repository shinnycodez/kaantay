import React from 'react';
import { Link } from 'react-router-dom';

const categories = [
    {
    id: 1,
    title: "Bracelets ˚⊹♡",
    imageUrl: "https://i.postimg.cc/wx0XrXnS/image.png",
    link: "Bracelets"
  },
  {
    id: 2,
    title: "Pendants ⋆｡𖦹°",
    imageUrl: "https://i.postimg.cc/CLRq6WGq/image.png",
      link: "Pendants",
  },


  //   {
  //   id: 4,
  //   title: "Bookmarks",
  //   imageUrl: "https://scontent.flhe7-2.fna.fbcdn.net/v/t1.15752-9/520429125_1334742338219253_2531984894124566733_n.jpg?stp=dst-jpg_s480x480_tt6&_nc_cat=103&ccb=1-7&_nc_sid=0024fc&_nc_ohc=j7XYMWWmVY8Q7kNvwFYLOQX&_nc_oc=Adkef7qEPDIiflArvyMlAj0FTg2JoPnp6bRd6DV5GSZcJB7m97b8m8ZRWL8id8lVe1k&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.flhe7-2.fna&oh=03_Q7cD2wF-rY8Fqy79pbeR3ML53F8zqAW-4GruhgPAjdrVNB5Twg&oe=68AC16BF"
  // },
      {
    id: 3,
    title: "Earrings ˚⋆𐙚｡",
    imageUrl: "https://pbs.twimg.com/media/G1SoQphW8AAN_8l?format=png&name=small",
      link: "Earrings"
  },
      {
    id: 4,
    title: "Resin jhumkas ｡°✩",
    imageUrl:"https://pbs.twimg.com/media/G1Sn5keXEAAWjmD?format=png&name=small",
     link: "Resin jhumkas"
  },
        {
    id: 5,
    title: "Vintage Collection⋆⭒˚.⋆",
    imageUrl:"https://i.postimg.cc/ZYd98r48/image.png",
     link: "Vintage Collection"
  },
  {
      id: 6,
    title: "Gifts ⋆⭒˚.⋆",
    imageUrl:"https://i.postimg.cc/cH8JcSyx/image.png",
     link: "Gifts"
  },
    {
      id: 7,
    title: "Flower preservation⋆⭒˚.⋆",
    imageUrl:"https://i.postimg.cc/HLrWpgLw/image.png",
     link: "Flower preservation"
  },
      {
      id: 7,
    title: "Rings⋆⭒˚.⋆",
    imageUrl:"https://pbs.twimg.com/media/G1Sn4YIWcAAnzup?format=png&name=small",
     link: "Rings"
  },
      {
      id: 7,
    title: "3 piece sets⭒˚.⋆",
    imageUrl:"https://i.postimg.cc/9Q4s0FGQ/image.png",
     link: "3 piece sets"
  },
        {
      id: 7,
    title: "Charms⭒˚.⋆",
    imageUrl:"https://i.postimg.cc/pXS1wbgb/image.png",
     link: "charms"
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
  <h2 className="text-[#141414] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
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
