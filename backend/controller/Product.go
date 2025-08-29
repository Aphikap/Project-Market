package controller

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"example.com/sa-example2/config"
	"example.com/sa-example2/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// controller/post_product.go

// dto/post_product.go
type CreateProductRequest struct {
	ProductName string   `json:"product_name" binding:"required"`
	Description string   `json:"description" binding:"required"`
	Price       float64  `json:"price" binding:"required"`
	Quantity    int      `json:"quantity" binding:"required"`
	CategoryID  uint     `json:"category_id" binding:"required"`
	SellerID    uint     `json:"seller_id" binding:"required"`
	Images      []string `json:"images" binding:"required"`
}


func CreateProduct(c *gin.Context) {
	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ครบ"})
		return
	}

	// 1. สร้าง Product
	product := entity.Product{
		Name:        req.ProductName,
		Description: req.Description,
	}
	if err := config.DB().Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสินค้าไม่สำเร็จ"})
		return
	}

	// 2. สร้าง Post_a_New_Product
	post := entity.Post_a_New_Product{
		Price:      req.Price,
		Quantity:   req.Quantity,
		Product_ID: &product.ID,
		Category_ID: &req.CategoryID,
		SellerID:   &req.SellerID,
	}
	if err := config.DB().Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "โพสต์สินค้าไม่สำเร็จ"})
		return
	}

	// 3. บันทึกรูปภาพ
	var images []entity.ProductImage
	for _, url := range req.Images {
		images = append(images, entity.ProductImage{
			ImagePath:  url,
			Product_ID: &product.ID,
		})
	}
	if err := config.DB().Create(&images).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกรูปภาพไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "สร้างสินค้าสำเร็จ",
		"product": product,
	})
}


func ListAllProducts(c *gin.Context){
	var posts []entity.Post_a_New_Product
	
	if err := config.DB().
		Preload("Product.ProductImage").Preload("Category").Preload("Seller").
		Find(&posts).Error; err != nil {
			c.JSON(http.StatusInternalServerError,gin.H{"error":"ไม่สามารถดึงข้อมูลสินค้าได้"})
			return
		}
		c.JSON(http.StatusOK,gin.H{"data":posts})
}

func ListMyPostProducts(c *gin.Context){
	sellerID,exists := c.Get("id")
	if !exists{
		c.JSON(http.StatusUnauthorized,gin.H{"error":"ไม่พอ seller ID"})
		return
	}

	var posts []entity.Post_a_New_Product
    if err := config.DB().
        Where("seller_id = ?", sellerID).
        Preload("Product.ProductImage").
        Preload("Category").
        Preload("Seller").
        Find(&posts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลโพสต์สินค้าได้"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"data": posts})
}

type UpdateProductReq struct {
	PostID      uint      `json:"post_id" binding:"required"`
	Name        *string   `json:"name"`
	Description *string   `json:"description"`
	Price       *float64  `json:"price"`
	Quantity    *int      `json:"quantity"`
	CategoryID  *uint     `json:"category_id"`
	Images      *[]string `json:"images"` // ส่งมาถือว่า replace ทั้งชุด
}

func UpdateProduct(c *gin.Context) {
	db := config.DB()

	var in UpdateProductReq
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	sellerID, ok := c.Get("id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ไม่พบ seller ID"})
		return
	}

	var post entity.Post_a_New_Product
	if err := db.Preload("Product").
		Where("id = ? AND seller_id = ?", in.PostID, sellerID).
		First(&post).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบโพสต์นี้"})
		return
	}

	// ✅ 1) เก็บ path รูปเก่าไว้ก่อน (สำหรับลบไฟล์หลัง tx สำเร็จ)
	var oldImgs []entity.ProductImage
	if in.Images != nil {
		_ = db.Where("product_id = ?", post.Product_ID).Find(&oldImgs).Error
	}

	// 2) ทำงานใน Transaction
	if err := db.Transaction(func(tx *gorm.DB) error {
		// products
		prodUpd := map[string]interface{}{}
		if in.Name != nil        { prodUpd["name"] = *in.Name }
		if in.Description != nil { prodUpd["description"] = *in.Description }
		if len(prodUpd) > 0 {
			if err := tx.Model(&entity.Product{}).
				Where("id = ?", post.Product_ID).
				Updates(prodUpd).Error; err != nil {
				return err
			}
		}

		// post_a_new_products
		postUpd := map[string]interface{}{}
		if in.Price != nil      { postUpd["price"] = *in.Price }
		if in.Quantity != nil   { postUpd["quantity"] = *in.Quantity }
		if in.CategoryID != nil { postUpd["category_id"] = *in.CategoryID }
		if len(postUpd) > 0 {
			if err := tx.Model(&entity.Post_a_New_Product{}).
				Where("id = ?", post.ID).
				Updates(postUpd).Error; err != nil {
				return err
			}
		}

		// images (replace ทั้งชุด)
		if in.Images != nil {
			if err := tx.Where("product_id = ?", post.Product_ID).
				Delete(&entity.ProductImage{}).Error; err != nil {
				return err
			}
			if len(*in.Images) > 0 {
				imgs := make([]entity.ProductImage, 0, len(*in.Images))
				for _, u := range *in.Images {
					imgs = append(imgs, entity.ProductImage{
						ImagePath:  u,
						Product_ID: post.Product_ID,
					})
				}
				if err := tx.Create(&imgs).Error; err != nil {
					return err
				}
			}
		}
		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	

	// ✅ 3) หลัง tx สำเร็จ: ลบไฟล์รูปเก่าออกจาก /uploads/products/*
	for _, im := range oldImgs {
		safeRemoveUnder("uploads/products", im.ImagePath)
	}

	_ = db.Preload("Product.ProductImage").
		Preload("Category").
		First(&post, post.ID).Error

	c.JSON(http.StatusOK, gin.H{"data": post})
}
// ===== Helper: ลบไฟล์อย่างปลอดภัยเฉพาะใต้ baseDir =====
func safeRemoveUnder(baseDir, p string) {
	if p == "" {
		return
	}
	// รองรับ path ที่เก็บแบบ "/uploads/products/xxx.jpg" หรือ "uploads/products/xxx.jpg"
	p = strings.TrimPrefix(p, "/")
	clean := filepath.Clean(p)

	// อนุญาตเฉพาะ path ที่อยู่ใต้ baseDir เท่านั้น (กัน path traversal)
	if !strings.HasPrefix(clean, baseDir+"/") && clean != baseDir {
		return
	}
	_ = os.Remove(clean) // ถ้าไม่มีไฟล์ก็เงียบ ๆ
}




func GetPostProductByID(c *gin.Context) {
    id := c.Param("id")

    // ถ้าอยากให้แก้ได้เฉพาะของตัวเอง
    sellerID, ok := c.Get("id")
    if !ok {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "ไม่พบ seller ID"})
        return
    }

    var post entity.Post_a_New_Product
    if err := config.DB().
        Where("id = ? AND seller_id = ?", id, sellerID). // ถ้าอยาก public ให้เอา seller_id ออก
        Preload("Product.ProductImage").
        Preload("Category").
        First(&post).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบโพสต์นี้"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"data": post})
}