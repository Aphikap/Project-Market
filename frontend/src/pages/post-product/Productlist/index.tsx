
import { ShoppingCartOutlined } from '@ant-design/icons';
import './Productlist.css'
import { useEffect, useState } from "react";
import { getAllproducts } from '../../../api/auth';
import { message } from 'antd';
import axios from 'axios';
import { getAllcategory } from '../../../api/categoty';
function ProductList() {

   const [products, setProducts] = useState<any[]>([]);
   const [categories, setCategories] = useState<any[]>([]);
   const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");

   useEffect(() => {
      const fetchData = async () => {
         try {
            const res = await getAllproducts();
            console.log(res);
            setProducts(res.data?.data || []);
         } catch (err) {
            console.error("โหลดสินค้าล้มเหลว:", err);
         }
      };
      fetchData();
   }, []);

   useEffect(() => {
      const fetchCategories = async () => {
         try {
            const res = await getAllcategory(); // 👉 API GET /api/category
            setCategories(res.data?.data || []);
            
         } catch (err) {
            console.error("โหลดหมวดหมู่ล้มเหลว:", err);
            message.error("โหลดหมวดหมู่ล้มเหลว");
         }
      };
      fetchCategories();
   }, []);

   const filteredProducts =
    selectedCategory === "ทั้งหมด"
      ? products
      : products.filter((p) => p?.Category?.name === selectedCategory);




   return (
      <>
         <div className='containerlist'>

            <nav>
               <ul
                  style={{
                     display: "flex",
                     gap: "16px",
                     listStyle: "none",
                     padding: 0,
                  }}
               >
                  <li
                     key="ทั้งหมด"
                     onClick={() => setSelectedCategory("ทั้งหมด")}
                     style={{
                        cursor: "pointer",
                        fontWeight: selectedCategory === "ทั้งหมด" ? "bold" : "normal",
                        borderBottom:
                           selectedCategory === "ทั้งหมด" ? "2px solid black" : "none",
                        paddingBottom: "10px",
                     }}
                  >
                     ทั้งหมด
                  </li>
                  {categories.map((cat) => (
                     <li
                        key={cat.ID}
                        onClick={() => setSelectedCategory(cat.name)}
                        style={{
                           cursor: "pointer",
                           fontWeight:
                              selectedCategory === cat.name ? "bold" : "normal",
                           borderBottom:
                              selectedCategory === cat.name ? "2px solid black" : "none",
                           paddingBottom: "10px",
                        }}
                     >
                        {cat.name}
                     </li>
                  ))}
               </ul>
            </nav>
            <section>
               <div className="image-grid">
                  {filteredProducts.map((product, idx) => {
                     const imageUrl = `http://localhost:8080${product?.Product?.ProductImage?.[0]?.image_path}`;



                     const name = product?.Product?.name || "ไม่มีชื่อสินค้า";
                     const price = product?.price || 0;
                     const quantity = product?.quantity || 0;

                     return (
                        <div className="image" key={idx}>
                           <img
                              src={imageUrl}
                              alt={`product-${idx}`}
                              style={{
                                 width: "184px",
                                 height: "184px",
                                 objectFit: "cover",
                                 border: "1px solid black",
                              }}
                           />
                           <br />
                           <p>{name}</p>

                           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <p style={{ margin: 0 }}>{price} บาท</p>
                              <ShoppingCartOutlined />
                           </div>

                           <p style={{ marginTop: "4px", fontSize: "0.9rem", color: "#555" }}>
                              คงเหลือ: {quantity}
                           </p>
                        </div>
                     );
                  })}
               </div>

            </section>
         </div>
      </>
   );



}

export default ProductList