package controller

import (
	"net/http"

	"example.com/sa-example2/config"
	"example.com/sa-example2/entity"
	"github.com/gin-gonic/gin"
)

// controller/post_product.go

// dto/post_product.go
type Category struct {
	Name string `json:"name" binding:"required"`
}

func CreateCategory(c *gin.Context) {
	var req Category
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลสินค้าไม่ครบ"})
		return
	}

	// 1. สร้าง Product
	category := entity.Category{
		Name: req.Name,
	}
	if err := config.DB().Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "เพิ่มหมวดหมู่สินค้าไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "สร้างหมวดหมู่สินค้าสำเร็จ",
		"Category": category,
	})
}

func ListCategoies(c *gin.Context) {
	var categories []entity.Category
	
	if err := config.DB().Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงข้อมูลหมวดหมู่ไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": categories})
}
