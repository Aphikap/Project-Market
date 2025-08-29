import React, { useEffect, useState } from "react";
import { Input, Button, List, Card, message } from "antd";
import axios from "axios";
import { EditOutlined,DeleteOutlined } from '@ant-design/icons';

interface CategoryType {
    ID: number;
    name: string;
}

const Category: React.FC = () => {
    const [categories, setCategories] = useState<CategoryType[]>([]);
    const [newCategory, setNewCategory] = useState(""); // เก็บค่าที่พิมพ์

    // ฟังก์ชันกดเพิ่มหมวดหมู่
    const fetchCategories = async () => {
        try {
            const res = await axios.get("http://localhost:8080/api/listCategory");
            console.log(res)
            setCategories(res.data.data || []);
        } catch (err) {
            console.error(err);
            message.error("โหลดหมวดหมู่ไม่สำเร็จ");
        }
    };

    // โหลด list ตอนเปิดหน้า
    useEffect(() => {
        fetchCategories();
    }, []);

    const handleAddCategory = async () => {
        if (!newCategory.trim()) {
            message.error("กรุณากรอกชื่อหมวดหมู่");
            return;
        }

        try {
            const res = await axios.post("http://localhost:8080/api/CreateCategory", {
                name: newCategory
            })
            console.log(res)
            setNewCategory("");
            fetchCategories();

        }
        catch (err: any) {
            console.error(err);
            message.error("เพิ่มหมวดหมู่ไม่สำเร็จ")

        }

        setNewCategory(""); // reset input
        message.success("เพิ่มหมวดหมู่เรียบร้อย");
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>เพิ่มหมวดหมู่สินค้า</h2>

            {/* กล่องกรอก + ปุ่ม */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <Input
                    placeholder="กรอกชื่อหมวดหมู่"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onPressEnter={handleAddCategory}
                />
                <Button type="primary" onClick={handleAddCategory}>
                    ➕ เพิ่มหมวดหมู่
                </Button>
            </div>

            {/* แสดง list หมวดหมู่ */}
            <Card title="รายการหมวดหมู่ทั้งหมด">
                <List
                    bordered
                    dataSource={categories}
                    renderItem={(item, index) => (
                        <List.Item>
                            {index + 1}. {item.name} <span>ID:</span> { item.ID}
                            <EditOutlined />
                            <DeleteOutlined />
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
};

export default Category;
