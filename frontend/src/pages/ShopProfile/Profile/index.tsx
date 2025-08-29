import React, { useEffect, useState } from 'react';
import './ShopProfile.css';
import { Link, useNavigate } from "react-router-dom";
import { EditOutlined, AppstoreOutlined,DeleteOutlined } from '@ant-design/icons';
import { getMyPostProducts, ListMyProfile } from '../../../api/auth';
import useEcomStore from '../../../store/ecom-store';

const ShopProfile: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [shopInfo, setShopInfo] = useState<any>(null);
  const token = useEcomStore((state: any) => state.token);

  useEffect(() => {
    const fetchMyProducts = async () => {
      try {
        if (!token) return;
        const res = await getMyPostProducts(token);
        const raw = res.data?.data || [];

        const mapped = raw.map((item: any) => {
          // ✅ ดึงหลายรูปจาก ProductImage (ถ้ามี)
          const images =
            item?.Product?.ProductImage?.map((img: any) => `http://localhost:8080${img?.image_path}`)?.filter(Boolean) || [];

          return {
            postId: item?.ID,              // ✅ ไอดีของโพสต์ (Post_a_New_Product.ID)
            productId: item?.Product?.ID,  // (ถ้าจะใช้ถึงค่อยหยิบ)
            id: item?.Product?.ID,
            name: item?.Product?.name,
            category: item?.Category?.name || "ไม่ระบุ",
            price: item?.price || 0,
            // เก็บทั้งก้อนเป็นอาร์เรย์ (ใช้สำหรับแกลเลอรี)
            images,
          };
        });

        setProducts(mapped);
      } catch (err) {
        console.error("โหลดสินค้าที่โพสต์ล้มเหลว", err);
      }
    };

    const fetchShopInfo = async () => {
      try {
        if (!token) return;
        const res = await ListMyProfile(token);
        setShopInfo(res.data?.data);
      } catch (err) {
        console.error("โหลดข้อมูลร้านค้าล้มเหลว", err);
      }
    };

    fetchMyProducts();
    fetchShopInfo();
  }, [token]);

  if (!shopInfo) return <p>กำลังโหลดข้อมูลร้านค้า...</p>;

  const {
    shop_name,
    slogan,
    shop_description,
    logo_path,
    Category,
    ShopAddress
  } = shopInfo;

  const categories = Category ? [Category.category_name] : [];

  return (
    <div className="shop-container">
      <div className="shop-header">
        <div className="shop-logo-box">
          <img src={'http://localhost:8080' + logo_path} alt="Shop Logo" className="shop-logo" />
        </div>
        <div className="shop-header-info">
          <h2 className="shop-name">{shop_name}</h2>
          <p className="shop-slogan">{slogan}</p>
        </div>
        <div className="icon-btn">

          <Link to="/user/profile/edit" aria-label="แก้ไขโปรไฟล์">
            <EditOutlined />
          </Link>
            <DeleteOutlined />


        </div>
      </div>

      <div className='card5'>
        <div className="shop-section">
          <h3>🛍 เกี่ยวกับร้าน</h3>
          <div className="shop-description-box">
            {shop_description || <i>ไม่มีข้อมูลคำอธิบายร้าน</i>}
          </div>
        </div>

        <div className="shop-section">
          <h3>📦 หมวดหมู่สินค้า</h3>
          <div className="shop-categories">
            {categories.map((cat, index) => (
              <span key={index} className="shop-tag">{cat}</span>
            ))}
          </div>
          <br />
          {products.length !== 0 && (
            <Link to="/user/create-post" className="btn-action">
              <h3>📤 ลงประกาศขายสินค้า</h3>
            </Link>
          )}
        </div>

        <div className="shop-section">
          <h3>📍 ที่อยู่ของร้าน</h3>
          <div className="shop-address-box">
            <div><strong>ที่อยู่:</strong> {ShopAddress?.address || <i>ไม่มีข้อมูล</i>}</div>
            <div><strong>ตำบล / แขวง:</strong> {ShopAddress?.sub_district || <i>ไม่มีข้อมูล</i>}</div>
            <div><strong>อำเภอ / เขต:</strong> {ShopAddress?.district || <i>ไม่มีข้อมูล</i>}</div>
            <div><strong>จังหวัด:</strong> {ShopAddress?.province || <i>ไม่มีข้อมูล</i>}</div>
          </div>
        </div>
      </div>

      <div className="shop-section">
        <h3><AppstoreOutlined style={{ marginRight: 6 }} /> รายการสินค้าที่โพสต์ ({products.length})</h3>
        {products.length === 0 ? (
          <>
            <p>ยังไม่มีสินค้าในร้านนี้</p>
            <Link to="/user/create-post" className="btn-action">
              <h3>📤 ลงประกาศสินค้าแรกของคุณเลย!</h3>
            </Link>
          </>
        ) : (
          <div className="product-list grid-wrap">
            {products.map((product) => (

              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── การ์ดสินค้าแบบมีแกลเลอรีรูปย่อย (จะแสดงเฉพาะเมื่อมีหลายรูป) ──
const ProductCard: React.FC<{ product: any }> = ({ product }) => {
  const imgs: string[] = Array.isArray(product.images) ? product.images : [];
  const [active, setActive] = useState(0);
  const navigate = useNavigate();

  return (
    <div className="product-card">
      <div className="product-edit-btn">
        <button
          onClick={() =>
            navigate(`/user/products/${product.postId}/edit`)
          }
        >

          <EditOutlined />
          <DeleteOutlined />
          
        </button>
      </div>

      {/* รูปหลัก: แสดงก็ต่อเมื่อมีอย่างน้อย 1 รูป */}
      {imgs.length > 0 && (
        <img
          className="main-image"
          src={imgs[active]}
          alt={product.name}
          loading="lazy"
        />
      )}

      {/* แถบรูปย่อย: แสดงเฉพาะเมื่อมีมากกว่า 1 รูป */}
      {imgs.length > 1 && (
        <div className="image-thumbnails" role="listbox" aria-label="รูปสินค้าเพิ่มเติม">
          {imgs.map((src, i) => (
            <button
              key={i}
              type="button"
              className={`thumb ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
              aria-selected={i === active}
              title={`รูปที่ ${i + 1}`}
            >
              <img src={src} alt={`มุมที่ ${i + 1}`} loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <h4 className="product-title">{product.name}</h4>
      <p className="product-cat">{product.category}</p>
      <p className="product-price">{product.price} บาท</p>
    </div>
  );
};

export default ShopProfile;
